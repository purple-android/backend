const path = require('path')
const fs = require('fs')

const THUMBNAILS_DIR = path.join(__dirname, '..', 'thumbnails')

const drawTextThumbnail = (text, thumbnailPath, label, headerColor) => {
  const { createCanvas } = require('canvas')

  const W = 300
  const H = 400
  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = headerColor
  ctx.fillRect(0, 0, W, 44)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 13px sans-serif'
  ctx.fillText(label, 14, 28)

  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 44)
  ctx.lineTo(W, 44)
  ctx.stroke()

  ctx.fillStyle = '#374151'
  ctx.font = '10px sans-serif'

  const cleaned = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim().slice(0, 1200)

  const padding   = 14
  const maxWidth  = W - padding * 2
  const lineH     = 15
  const startY    = 62
  const maxLines  = Math.floor((H - startY - padding) / lineH)

  let lineCount = 0
  let y = startY

  const paragraphs = cleaned.split('\n')

  outer:
  for (const para of paragraphs) {
    if (para.trim() === '') {
      y += lineH * 0.5
      continue
    }

    const words = para.split(' ')
    let currentLine = ''

    for (const word of words) {
      if (lineCount >= maxLines) break outer

      const testLine = currentLine ? currentLine + ' ' + word : word

      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        ctx.fillText(currentLine, padding, y)
        currentLine = word
        y += lineH
        lineCount++
      } else {
        currentLine = testLine
      }
    }

    if (lineCount < maxLines && currentLine) {
      ctx.fillText(currentLine, padding, y)
      y += lineH
      lineCount++
    }
  }

  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1)

  fs.writeFileSync(thumbnailPath, canvas.toBuffer('image/png'))
}

const generatePdfThumbnail = async (filePath, thumbnailPath) => {
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js')
  const { createCanvas } = require('canvas')

  const pdfData = new Uint8Array(fs.readFileSync(filePath))

  const canvasFactory = {
    create:  (w, h) => { const c = createCanvas(w, h); return { canvas: c, context: c.getContext('2d') } },
    reset:   (o, w, h) => { o.canvas.width = w; o.canvas.height = h },
    destroy: (o) => { o.canvas.width = 0; o.canvas.height = 0 }
  }

  const pdf  = await pdfjsLib.getDocument({ data: pdfData, canvasFactory }).promise
  const page = await pdf.getPage(1)

  const scale    = 300 / page.getViewport({ scale: 1 }).width
  const viewport = page.getViewport({ scale })

  const { canvas, context } = canvasFactory.create(viewport.width, viewport.height)
  await page.render({ canvasContext: context, viewport }).promise
  fs.writeFileSync(thumbnailPath, canvas.toBuffer('image/png'))
}

const generateDocxThumbnail = async (filePath, thumbnailPath) => {
  const mammoth = require('mammoth')
  const result  = await mammoth.extractRawText({ path: filePath })
  const text    = result.value.trim() || '(empty document)'
  drawTextThumbnail(text, thumbnailPath, 'DOCX', '#2563eb')
}
const generateDocThumbnail = async (filePath, thumbnailPath) => {
  try {
    const mammoth = require('mammoth')
    const result  = await mammoth.extractRawText({ path: filePath })
    const text    = result.value.trim() || '(empty document)'
    drawTextThumbnail(text, thumbnailPath, 'DOC', '#1d4ed8')
  } catch {
    drawTextThumbnail('Word Document (.doc)', thumbnailPath, 'DOC', '#1d4ed8')
  }
}

const generateTxtThumbnail = (filePath, thumbnailPath) => {
  const text = fs.readFileSync(filePath, 'utf8').trim() || '(empty file)'
  drawTextThumbnail(text, thumbnailPath, 'TXT', '#6b7280')
}

const generateThumbnail = async (filePath, mimeType, baseFilename) => {
  try {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true })

    const thumbnailFilename = baseFilename + '.thumb.png'
    const thumbnailPath     = path.join(THUMBNAILS_DIR, thumbnailFilename)

    if (mimeType === 'application/pdf') {
      await generatePdfThumbnail(filePath, thumbnailPath)

    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      await generateDocxThumbnail(filePath, thumbnailPath)

    } else if (mimeType === 'application/msword') {
      await generateDocThumbnail(filePath, thumbnailPath)

    } else if (mimeType === 'text/plain') {
      generateTxtThumbnail(filePath, thumbnailPath)

    } else {
      return null
    }

    return thumbnailFilename

  } catch (err) {
    console.log('Thumbnail generation skipped:', err.message)
    return null
  }
}

const deleteThumbnail = (thumbnailFilename) => {
  if (!thumbnailFilename) return
  const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename)
  if (fs.existsSync(thumbnailPath)) {
    fs.unlinkSync(thumbnailPath)
  }
}

module.exports = { generateThumbnail, deleteThumbnail }

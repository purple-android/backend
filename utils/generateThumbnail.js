const path = require('path')
const fs = require('fs')

const THUMBNAILS_DIR = path.join(__dirname, '..', 'thumbnails')

const generateThumbnail = async (filePath, mimeType, baseFilename) => {

  if (mimeType !== 'application/pdf') return null

  try {
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js')

    const { createCanvas } = require('canvas')

    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true })

    const thumbnailFilename = baseFilename + '.thumb.png'
    const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename)

    const pdfData = new Uint8Array(fs.readFileSync(filePath))

    const canvasFactory = {
      create: (width, height) => {
        const canvas = createCanvas(width, height)
        return { canvas, context: canvas.getContext('2d') }
      },
      reset: (obj, width, height) => {
        obj.canvas.width = width
        obj.canvas.height = height
      },
      destroy: (obj) => {
        obj.canvas.width = 0
        obj.canvas.height = 0
      }
    }

    const pdf = await pdfjsLib.getDocument({ data: pdfData, canvasFactory }).promise

    const page = await pdf.getPage(1)

    const originalViewport = page.getViewport({ scale: 1 })

    const scale = 300 / originalViewport.width
    const viewport = page.getViewport({ scale })

    const { canvas, context } = canvasFactory.create(viewport.width, viewport.height)

    await page.render({ canvasContext: context, viewport }).promise

    fs.writeFileSync(thumbnailPath, canvas.toBuffer('image/png'))

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
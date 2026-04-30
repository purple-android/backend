const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { getFiles, uploadFile, deleteFile } = require('../controllers/fileController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsPath = path.join(__dirname, '..', 'uploads')
    fs.mkdirSync(uploadsPath, { recursive: true })
    cb(null, uploadsPath)
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname
    cb(null, uniqueName)
  }
})

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()

  // List of allowed file extensions
  const allowedExtensions = [
    // Documents
    '.pdf', '.doc', '.docx', '.txt',
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
    // Videos
    '.mp4', '.mov', '.avi', '.webm', '.mkv'
  ]

  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    // Images — image/* covers all image types
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
    // Videos
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'
  ]

  if (allowedExtensions.includes(ext) || allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('File type not allowed. Use images, videos, .pdf, .doc, .docx, or .txt'), false)
  }
}

const upload = multer({ storage, fileFilter })

router.use(requireAuth)

router.get('/', getFiles)

router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    uploadFile(req, res, next)
  })
})

router.delete('/:id', deleteFile)

module.exports = router

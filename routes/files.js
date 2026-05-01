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

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt']

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]

  if (allowedExtensions.includes(ext) || allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only .pdf, .doc, .docx and .txt files are allowed'), false)
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

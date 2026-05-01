const File = require('../models/fileModel')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { generateThumbnail, deleteThumbnail } = require('../utils/generateThumbnail')

const MAX_FILES = 50

const deleteFromDisk = (filename) => {
  const filePath = path.join(__dirname, '..', 'uploads', filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

const getFiles = async (req, res) => {
  const user_id = req.user._id

  const files = await File.find({ user_id }).sort({ createdAt: -1 })

  res.status(200).json(files)
}

// Save a newly uploaded file's info to the database
const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please select a file to upload' })
  }

  try {
    const user_id = req.user._id

    const fileBuffer = fs.readFileSync(req.file.path)
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex')

    const fileCount = await File.countDocuments({ user_id })
    if (fileCount >= MAX_FILES) {
      deleteFromDisk(req.file.filename)
      return res.status(400).json({ error: `You have reached the maximum limit of ${MAX_FILES} files` })
    }

    const duplicate = await File.findOne({ user_id, hash })
    if (duplicate) {
      deleteFromDisk(req.file.filename)
      return res.status(400).json({
        error: `You already uploaded this file (as "${duplicate.originalName}")`
      })
    }

    const thumbnailFilename = await generateThumbnail(req.file.path, req.file.mimetype, req.file.filename)

    const file = await File.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      hash,
      thumbnailFilename: thumbnailFilename || null,
      user_id
    })

    res.status(200).json(file)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const deleteFile = async (req, res) => {
  const { id } = req.params

  const file = await File.findOneAndDelete({ _id: id, user_id: req.user._id })

  if (!file) {
    return res.status(400).json({ error: 'No such file' })
  }

  deleteFromDisk(file.filename)
  deleteThumbnail(file.thumbnailFilename)

  res.status(200).json(file)
}

module.exports = { getFiles, uploadFile, deleteFile }
const File = require('../models/fileModel')
const path = require('path')
const fs = require('fs')

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

const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please select a file to upload' })
  }

  try {
    const user_id = req.user._id

    const fileCount = await File.countDocuments({ user_id })
    if (fileCount >= MAX_FILES) {
      deleteFromDisk(req.file.filename)
      return res.status(400).json({ error: `You have reached the maximum limit of ${MAX_FILES} files` })
    }

    const duplicate = await File.findOne({ user_id, originalName: req.file.originalname })
    if (duplicate) {
      deleteFromDisk(req.file.filename)
      return res.status(400).json({ error: `You already have a file named "${req.file.originalname}"` })
    }

    const file = await File.create({
      originalName: req.file.originalname, // original filename from user's computer
      filename: req.file.filename,         // unique filename we saved it as on disk
      mimetype: req.file.mimetype,         // file type (e.g. "image/jpeg")
      size: req.file.size,                 // file size in bytes
      user_id                              // which user uploaded it
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

  res.status(200).json(file)
}

module.exports = { getFiles, uploadFile, deleteFile }
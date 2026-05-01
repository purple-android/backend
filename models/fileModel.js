const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  user_id: { type: String, required: true },
  hash: { type: String, required: true },
  thumbnailFilename: { type: String, default: null }
}, { timestamps: true })

module.exports = mongoose.model('File', fileSchema)

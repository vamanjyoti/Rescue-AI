const mongoose = require('mongoose')

const disasterSchema = new mongoose.Schema({
  disasterType:    { type: String, required: true },
  location:        { type: String, required: true },
  severity:        { type: Number, required: true, min: 1, max: 10 },
  priorityLevel:   { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
  priorityScore:   { type: Number },
  teams:           { type: Number },
  medicalKits:     { type: Number },
  foodPacks:       { type: Number },
  alertMessage:    { type: String },
  createdAt:       { type: Date, default: Date.now },
})

module.exports = mongoose.model('Disaster', disasterSchema)

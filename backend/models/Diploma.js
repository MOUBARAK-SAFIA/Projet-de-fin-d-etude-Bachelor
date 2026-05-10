const mongoose = require('mongoose');

const diplomaSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  degree: {
    type: String,
    required: true,
    trim: true
  },
  institution: {
    type: String,
    required: true,
    trim: true
  },
  graduationDate: {
    type: Date,
    required: true
  },
  grade: {
    type: String,
    required: true,
    trim: true
  },
  hash: {
    type: String,
    required: true,
    unique: true
  },
  txHash: {
    type: String,
    required: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Diploma', diplomaSchema);

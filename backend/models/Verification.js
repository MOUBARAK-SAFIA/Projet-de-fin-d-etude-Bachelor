const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  verifierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  diplomaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diploma',
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  isValid: {
    type: Boolean,
    required: true
  },
  isRevoked: {
    type: Boolean,
    required: true,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Verification', verificationSchema);

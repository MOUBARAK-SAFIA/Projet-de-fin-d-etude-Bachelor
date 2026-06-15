const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['diploma_verified'],
      default: 'diploma_verified',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      diplomaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Diploma',
      },
      verifierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      verifierName: String,
      studentName: String,
      studentId: String,
      status: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);

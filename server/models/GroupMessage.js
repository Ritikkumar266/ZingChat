const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderUsername: {
    type: String,
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  fileUrl: String,
  fileName: String,
  fileType: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GroupMessage', groupMessageSchema);

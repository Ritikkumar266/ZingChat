const mongoose = require('mongoose');

const privateMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderUsername: String,
  receiverUsername: String,
  text: {
    type: String,
    default: ''
  },
  fileUrl: String,
  fileName: String,
  fileType: String,
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PrivateMessage', privateMessageSchema);

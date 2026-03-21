require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

const User = require('./models/User');
const Message = require('./models/Message');
const OTP = require('./models/OTP');
const PasswordReset = require('./models/PasswordReset');
const PrivateMessage = require('./models/PrivateMessage');
const authMiddleware = require('./middleware/auth');
const { sendOTP, generateOTP } = require('./services/emailService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app', {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Store active users
const users = new Map();

// ============ AUTH ROUTES ============

// Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const otp = generateOTP();
    await OTP.deleteMany({ email }); // Delete old OTPs
    await OTP.create({ email, otp });

    const result = await sendOTP(email, otp);
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    await OTP.deleteOne({ _id: otpRecord._id });
    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password - Send OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email not found' });
    }

    const otp = generateOTP();
    await PasswordReset.deleteMany({ email });
    await PasswordReset.create({ email, otp });

    const result = await sendOTP(email, otp);
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Reset OTP
app.post('/api/auth/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    const resetRecord = await PasswordReset.findOne({ email, otp });
    if (!resetRecord) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const resetRecord = await PasswordReset.findOne({ email, otp });
    if (!resetRecord) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    await PasswordReset.deleteOne({ _id: resetRecord._id });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ MESSAGE ROUTES ============

// Get all users
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}, 'username email createdAt').lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get message history
app.get('/api/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ timestamp: 1 })
      .limit(100)
      .lean();

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get private messages between two users
app.get('/api/private-messages/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const messages = await PrivateMessage.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    }).sort({ timestamp: 1 }).lean();

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send private message
app.post('/api/private-messages', authMiddleware, async (req, res) => {
  try {
    const { receiverId, text, fileUrl, fileName, fileType } = req.body;
    const senderId = req.userId;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID required' });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const message = new PrivateMessage({
      sender: senderId,
      receiver: receiverId,
      senderUsername: sender.username,
      receiverUsername: receiver.username,
      text: text || '',
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileType: fileType || null
    });

    await message.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SOCKET.IO ============

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // User joins
  socket.on('join', async (data) => {
    try {
      const { username, userId } = data;
      users.set(socket.id, { username, userId, socketId: socket.id });

      // Load message history
      const messages = await Message.find()
        .sort({ timestamp: 1 })
        .limit(100)
        .lean();

      socket.emit('messageHistory', messages);

      // Notify all users
      io.emit('userJoined', {
        username,
        userCount: users.size,
        users: Array.from(users.values()).map(u => ({ username: u.username, userId: u.userId }))
      });

      console.log(`${username} joined. Total users: ${users.size}`);
    } catch (error) {
      console.error('Join error:', error);
    }
  });

  // Handle messages
  socket.on('message', async (data) => {
    try {
      const user = users.get(socket.id);
      if (!user) return;

      const message = new Message({
        sender: user.userId,
        senderUsername: user.username,
        text: data.text || '',
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        fileType: data.fileType || null
      });

      await message.save();

      const messageData = {
        _id: message._id,
        username: user.username,
        userId: user.userId,
        text: data.text || '',
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        fileType: data.fileType || null,
        timestamp: message.timestamp
      };

      io.emit('message', messageData);
      console.log(`Message from ${user.username}: ${data.text || '[File]'}`);
    } catch (error) {
      console.error('Message error:', error);
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('userTyping', {
        username: user.username,
        isTyping: data.isTyping
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      io.emit('userLeft', {
        username: user.username,
        userCount: users.size,
        users: Array.from(users.values()).map(u => ({ username: u.username, userId: u.userId }))
      });
      console.log(`${user.username} left. Total users: ${users.size}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});

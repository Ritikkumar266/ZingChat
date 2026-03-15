# Realtime Chat Application

A full-featured realtime chat application with separate frontend and backend architecture.

## 🎯 Features

### Basic Features ✅
- User authentication (signup/login)
- Real-time messaging
- Online users list
- User join/leave notifications

### Advanced Features ✅
- Email OTP verification
- Message timestamps
- Typing indicators
- File/image sharing (up to 10MB)
- Dark/Light mode toggle
- Message history (MongoDB)
- Password hashing (bcryptjs)
- JWT authentication
- Responsive design

## 📁 Project Structure

```
realtime-chat/
├── frontend/          # Client-side (HTML, CSS, JS)
├── server/            # Backend (Node.js, Express, Socket.IO)
├── README.md          # This file
├── SETUP.md           # Setup instructions
└── PROJECT_STRUCTURE.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js v14+
- MongoDB (local or Atlas)
- npm

### 1. Clone Repository
```bash
git clone <repo-url>
cd realtime-chat
```

### 2. Setup Backend

```bash
cd server
npm install
```

Create `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app
JWT_SECRET=your_secret_key_here
PORT=3000
NODE_ENV=development
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 3. Start Backend
```bash
npm start
```

Server runs on `http://localhost:3000`

### 4. Open in Browser
Visit `http://localhost:3000` and start chatting!

## 🔧 Configuration

### MongoDB Setup

**Option A: Local MongoDB**
```env
MONGODB_URI=mongodb://localhost:27017/chat-app
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Get connection string
4. Add to `.env`

### Email Configuration (Gmail)

1. Enable 2-factor authentication on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## 📚 API Documentation

### Authentication Endpoints

**Register**
```
POST /api/auth/register
Body: { username, email, password }
```

**Login**
```
POST /api/auth/login
Body: { email, password }
```

**Send OTP**
```
POST /api/auth/send-otp
Body: { email }
```

**Verify OTP**
```
POST /api/auth/verify-otp
Body: { email, otp }
```

### Message Endpoints

**Get Messages**
```
GET /api/messages
Headers: { Authorization: Bearer token }
```

**Upload File**
```
POST /api/upload
Headers: { Authorization: Bearer token }
Body: FormData with file
```

## 🔌 Socket.IO Events

### Client → Server
- `join` - User joins chat
- `message` - Send message
- `typing` - Typing indicator

### Server → Client
- `messageHistory` - Load past messages
- `message` - Receive message
- `userJoined` - User joined
- `userLeft` - User left
- `userTyping` - User typing

## 🎨 Frontend Features

- Clean, modern UI
- Dark/Light mode
- Responsive design
- Real-time updates
- File upload with progress
- Typing indicators
- Message notifications

## 🔐 Security Features

- Password hashing (bcryptjs)
- JWT authentication
- CORS enabled
- File size limits
- XSS protection
- Input validation
- OTP verification

## 📦 Dependencies

### Backend
- express - Web framework
- socket.io - Real-time communication
- mongoose - MongoDB ODM
- jsonwebtoken - JWT auth
- bcryptjs - Password hashing
- nodemailer - Email service
- multer - File upload
- dotenv - Environment variables

### Frontend
- Socket.IO client
- Vanilla JavaScript
- HTML5
- CSS3

## 🚢 Deployment

### Backend (Heroku)
```bash
cd server
heroku login
heroku create your-app-name
git push heroku main
heroku config:set MONGODB_URI=your_uri
heroku config:set JWT_SECRET=your_secret
```

### Frontend (Vercel)
```bash
cd frontend
vercel
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check connection string in `.env`
- Ensure MongoDB is running
- For Atlas, whitelist your IP

### Email Not Sending
- Verify Gmail app password
- Check EMAIL_USER and EMAIL_PASSWORD
- Enable "Less secure apps" if needed

### File Upload Not Working
- Check file size (max 10MB)
- Ensure uploads folder exists
- Check server logs

### Can't Create Account
- Check MongoDB connection
- Verify email format
- Check for duplicate username/email

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| MONGODB_URI | Database URL | mongodb+srv://... |
| JWT_SECRET | Token secret | random_string_here |
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| EMAIL_USER | Gmail address | user@gmail.com |
| EMAIL_PASSWORD | App password | xxxx xxxx xxxx xxxx |

## 🎓 Learning Resources

- [Express.js](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [MongoDB](https://www.mongodb.com/)
- [JWT](https://jwt.io/)
- [Nodemailer](https://nodemailer.com/)

## 📄 License

MIT

## 🤝 Contributing

Feel free to fork and submit pull requests!

## 📞 Support

For issues, check the troubleshooting section or create an issue on GitHub.

---

**Happy Chatting! 🎉**

# Project Structure

```
realtime-chat/
│
├── frontend/                    # Frontend (React/Vue/Vanilla JS)
│   ├── index.html              # Main HTML file
│   ├── styles.css              # Styling
│   ├── app.js                  # Client-side logic
│   └── package.json            # Frontend dependencies (optional)
│
├── server/                      # Backend (Node.js/Express)
│   ├── models/                 # Database models
│   │   ├── User.js             # User schema
│   │   ├── Message.js          # Message schema
│   │   └── OTP.js              # OTP schema
│   │
│   ├── middleware/             # Express middleware
│   │   └── auth.js             # JWT authentication
│   │
│   ├── services/               # Business logic
│   │   └── emailService.js     # Email/OTP service
│   │
│   ├── uploads/                # File storage
│   │
│   ├── index.js                # Main server file
│   ├── package.json            # Backend dependencies
│   ├── .env                    # Environment variables (DO NOT COMMIT)
│   └── .env.example            # Example env file
│
├── README.md                    # Project documentation
├── SETUP.md                     # Setup instructions
└── PROJECT_STRUCTURE.md         # This file
```

## Folder Descriptions

### Frontend (`/frontend`)
- Contains all client-side code
- HTML, CSS, JavaScript
- Socket.IO client library
- Runs on the browser
- Can be deployed separately to Vercel, Netlify, etc.

### Backend (`/server`)
- Contains all server-side code
- Express.js API routes
- MongoDB models
- Authentication middleware
- Email service
- File upload handling
- Socket.IO server
- Runs on Node.js

## Development

### Start Backend
```bash
cd server
npm install
npm start
```

### Start Frontend
Frontend is served by the backend at `http://localhost:3000`

## Deployment

### Backend Deployment (Heroku, Railway, Render)
```bash
cd server
git push heroku main
```

### Frontend Deployment (Vercel, Netlify)
```bash
cd frontend
npm run build
# Deploy the build folder
```

## Environment Variables

Backend `.env` file:
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
PORT=3000
NODE_ENV=development
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## API Endpoints

All API endpoints are prefixed with `/api`:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP

### Messages
- `GET /api/messages` - Get message history
- `POST /api/upload` - Upload file

## Socket.IO Events

### Client → Server
- `join` - User joins chat
- `message` - Send message
- `typing` - Typing indicator

### Server → Client
- `messageHistory` - Load past messages
- `message` - Receive message
- `userJoined` - User joined notification
- `userLeft` - User left notification
- `userTyping` - Typing indicator

## File Structure Best Practices

✅ **Separate frontend and backend**
- Different deployment strategies
- Independent scaling
- Clear separation of concerns

✅ **Organized backend structure**
- Models for database schemas
- Middleware for cross-cutting concerns
- Services for business logic
- Routes for API endpoints

✅ **Environment variables**
- Never commit `.env` file
- Use `.env.example` as template
- Different configs for dev/prod

✅ **Uploads folder**
- Stores user-uploaded files
- Should be in `.gitignore`
- Consider cloud storage (AWS S3) for production

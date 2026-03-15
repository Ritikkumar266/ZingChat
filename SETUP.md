# Quick Setup Guide

## Step 1: Install Dependencies

```bash
cd server
npm install
```

## Step 2: Setup MongoDB

### Option A: Local MongoDB
1. Download and install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Create `.env` file in server folder:
```env
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your_secret_key_123
PORT=3000
NODE_ENV=development
```

### Option B: MongoDB Atlas (Cloud - Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string
5. Create `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app
JWT_SECRET=your_secret_key_123
PORT=3000
NODE_ENV=development
```

## Step 3: Start Server

```bash
cd server
npm start
```

You should see:
```
MongoDB connected
Chat server running on http://localhost:3000
```

## Step 4: Open in Browser

Open `http://localhost:3000` in your browser

## Step 5: Test the App

1. **Sign Up**: Create a new account
2. **Login**: Login with your credentials
3. **Chat**: Open another tab and login with different account
4. **Test Features**:
   - Send messages
   - Upload files (📎 button)
   - Toggle dark mode (🌙 button)
   - See typing indicators
   - View online users

## Troubleshooting

### Port 3000 already in use?
```bash
# Change PORT in .env to 3001
PORT=3001
```

### MongoDB connection failed?
- Check if MongoDB is running
- Verify connection string in .env
- For Atlas, check IP whitelist

### Files not uploading?
- Check file size (max 10MB)
- Ensure server/uploads folder exists
- Check browser console for errors

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| MONGODB_URI | Database connection | mongodb://localhost:27017/chat-app |
| JWT_SECRET | Secret for tokens | your_secret_key_123 |
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |

## Features to Try

✅ **Authentication**
- Sign up with email
- Login with credentials
- Logout

✅ **Messaging**
- Send text messages
- See message history
- Timestamps on messages

✅ **Real-time**
- See online users
- Typing indicators
- User join/leave notifications

✅ **Files**
- Upload images, documents, videos
- Download files
- Progress bar

✅ **Themes**
- Toggle dark mode
- Preference saved

## Next Steps

- Deploy to Heroku/Vercel
- Add more features
- Customize styling
- Add user profiles
- Implement private messaging

## Need Help?

Check the README.md for more details and API documentation.

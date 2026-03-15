const socket = io();

// DOM ELEMENTS - Wait for DOM to load
let authScreen, chatScreen, loginForm, registerForm, loginEmail, loginPassword, loginBtn;
let registerUsername, registerEmail, registerPassword, registerConfirm, registerBtn, authError;
let messageInput, sendBtn, messagesList, usersList, userCount, typingIndicator;
let fileInput, themeToggle, logoutBtn, uploadProgress, progressBar, notification;
let sendOtpBtn, verifyOtpBtn, otpInput;

// STATE
let currentUser = null;
let token = null;
let typingTimeout;
let typingUsers = new Set();
let otpVerified = false;

// Initialize DOM elements
function initDOM() {
  authScreen = document.getElementById('authScreen');
  chatScreen = document.getElementById('chatScreen');
  loginForm = document.getElementById('loginForm');
  registerForm = document.getElementById('registerForm');
  loginEmail = document.getElementById('loginEmail');
  loginPassword = document.getElementById('loginPassword');
  loginBtn = document.getElementById('loginBtn');
  registerUsername = document.getElementById('registerUsername');
  registerEmail = document.getElementById('registerEmail');
  registerPassword = document.getElementById('registerPassword');
  registerConfirm = document.getElementById('registerConfirm');
  registerBtn = document.getElementById('registerBtn');
  authError = document.getElementById('authError');
  messageInput = document.getElementById('messageInput');
  sendBtn = document.getElementById('sendBtn');
  messagesList = document.getElementById('messagesList');
  usersList = document.getElementById('usersList');
  userCount = document.getElementById('userCount');
  typingIndicator = document.getElementById('typingIndicator');
  fileInput = document.getElementById('fileInput');
  themeToggle = document.getElementById('themeToggle');
  logoutBtn = document.getElementById('logoutBtn');
  uploadProgress = document.getElementById('uploadProgress');
  progressBar = document.querySelector('.progress-bar');
  notification = document.getElementById('notification');
  sendOtpBtn = document.getElementById('sendOtpBtn');
  verifyOtpBtn = document.getElementById('verifyOtpBtn');
  otpInput = document.getElementById('otpInput');

  attachEventListeners();
}

function attachEventListeners() {
  // Auth events
  loginBtn.addEventListener('click', handleLogin);
  registerBtn.addEventListener('click', handleRegister);
  sendOtpBtn.addEventListener('click', handleSendOTP);
  verifyOtpBtn.addEventListener('click', handleVerifyOTP);
  themeToggle.addEventListener('click', toggleTheme);
  logoutBtn.addEventListener('click', handleLogout);

  // Message events
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // File upload
  fileInput.addEventListener('change', handleFileUpload);

  // Typing
  messageInput.addEventListener('input', handleTyping);
}

// INITIALIZATION
window.addEventListener('load', () => {
  initDOM();

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
  }

  const savedToken = localStorage.getItem('token');
  if (savedToken) {
    token = savedToken;
    currentUser = JSON.parse(localStorage.getItem('user'));
    enterChat();
  }
});

// AUTH FUNCTIONS
function toggleAuthForm() {
  loginForm.classList.toggle('active');
  registerForm.classList.toggle('active');
  authError.classList.remove('show');
  authError.textContent = '';
  otpVerified = false;
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.add('show');
}

async function handleSendOTP() {
  const email = registerEmail.value.trim();

  if (!email) {
    showAuthError('Please enter email');
    return;
  }

  try {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      showAuthError(data.error || 'Failed to send OTP');
      return;
    }

    showAuthError('');
    showNotification('OTP sent to your email');
    
    otpInput.style.display = 'block';
    verifyOtpBtn.style.display = 'block';
    sendOtpBtn.disabled = true;
    registerEmail.disabled = true;
  } catch (error) {
    showAuthError('Error: ' + error.message);
  }
}

async function handleVerifyOTP() {
  const email = registerEmail.value.trim();
  const otp = otpInput.value.trim();

  if (!otp) {
    showAuthError('Please enter OTP');
    return;
  }

  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    const data = await response.json();

    if (!response.ok) {
      showAuthError(data.error || 'Invalid OTP');
      return;
    }

    otpVerified = true;
    showAuthError('');
    showNotification('Email verified! Complete registration');
    
    registerUsername.style.display = 'block';
    registerPassword.style.display = 'block';
    registerConfirm.style.display = 'block';
    registerBtn.style.display = 'block';
    
    otpInput.style.display = 'none';
    verifyOtpBtn.style.display = 'none';
  } catch (error) {
    showAuthError('Error: ' + error.message);
  }
}

async function handleLogin() {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!email || !password) {
    showAuthError('Please fill in all fields');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showAuthError(data.error || 'Login failed');
      return;
    }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));

    enterChat();
  } catch (error) {
    showAuthError('Connection error: ' + error.message);
  }
}

async function handleRegister() {
  if (!otpVerified) {
    showAuthError('Please verify your email first');
    return;
  }

  const username = registerUsername.value.trim();
  const email = registerEmail.value.trim();
  const password = registerPassword.value.trim();
  const confirm = registerConfirm.value.trim();

  if (!username || !email || !password || !confirm) {
    showAuthError('Please fill in all fields');
    return;
  }

  if (password !== confirm) {
    showAuthError('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showAuthError(data.error || 'Registration failed');
      return;
    }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));

    enterChat();
  } catch (error) {
    showAuthError('Connection error: ' + error.message);
  }
}

function enterChat() {
  authScreen.classList.remove('active');
  chatScreen.classList.add('active');
  
  socket.emit('join', {
    username: currentUser.username,
    userId: currentUser.id
  });

  messageInput.focus();
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  token = null;
  otpVerified = false;
  
  authScreen.classList.add('active');
  chatScreen.classList.remove('active');
  
  messagesList.innerHTML = '';
  usersList.innerHTML = '';
  messageInput.value = '';
  
  socket.disconnect();
  socket.connect();
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
}

// MESSAGE FUNCTIONS
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  socket.emit('message', { text });
  messageInput.value = '';
  socket.emit('typing', { isTyping: false });
  clearTimeout(typingTimeout);
}

// FILE UPLOAD
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    showNotification('File size must be less than 10MB', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  uploadProgress.style.display = 'block';
  progressBar.style.width = '0%';

  try {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        progressBar.style.width = percentComplete + '%';
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        socket.emit('message', {
          text: '',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileType: data.fileType
        });
        showNotification('File uploaded successfully');
      } else {
        showNotification('Upload failed', 'error');
      }
      uploadProgress.style.display = 'none';
      fileInput.value = '';
    });

    xhr.addEventListener('error', () => {
      showNotification('Upload error', 'error');
      uploadProgress.style.display = 'none';
      fileInput.value = '';
    });

    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  } catch (error) {
    showNotification('Upload error: ' + error.message, 'error');
    uploadProgress.style.display = 'none';
    fileInput.value = '';
  }
}

// TYPING INDICATOR
function handleTyping() {
  socket.emit('typing', { isTyping: true });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing', { isTyping: false });
  }, 3000);
}

// SOCKET EVENTS
socket.on('messageHistory', (messages) => {
  messagesList.innerHTML = '';
  messages.forEach(msg => displayMessage(msg));
  scrollToBottom();
});

socket.on('message', (message) => {
  displayMessage(message);
  
  if (message.userId !== currentUser?.id) {
    showNotification(`${message.username}: ${message.text || '[File]'}`);
  }
  
  scrollToBottom();
});

socket.on('userJoined', (data) => {
  userCount.textContent = data.userCount;
  updateUsersList(data.users);
  displaySystemMessage(`${data.username} joined the chat`);
  showNotification(`${data.username} joined`);
  scrollToBottom();
});

socket.on('userLeft', (data) => {
  userCount.textContent = data.userCount;
  updateUsersList(data.users);
  displaySystemMessage(`${data.username} left the chat`);
  scrollToBottom();
});

socket.on('userTyping', (data) => {
  if (data.isTyping) {
    typingUsers.add(data.username);
    showTypingIndicator();
  } else {
    typingUsers.delete(data.username);
    if (typingUsers.size === 0) {
      hideTypingIndicator();
    }
  }
});

// DISPLAY FUNCTIONS
function displayMessage(message) {
  const messageEl = document.createElement('div');
  const isOwn = message.userId === currentUser?.id;
  messageEl.className = `message ${isOwn ? 'own' : 'other'}`;

  if (message.fileUrl) {
    const fileIcon = getFileIcon(message.fileType);
    messageEl.innerHTML = `
      <div class="file-message">
        <div class="file-icon">${fileIcon}</div>
        <div class="file-info">
          <div class="file-name">${escapeHtml(message.fileName)}</div>
          <a href="${message.fileUrl}" download class="file-download">Download</a>
        </div>
      </div>
      <div class="message-meta">${message.senderUsername} • ${formatTime(message.timestamp)}</div>
    `;
  } else {
    messageEl.innerHTML = `
      <div class="message-content">${escapeHtml(message.text)}</div>
      <div class="message-meta">${message.senderUsername} • ${formatTime(message.timestamp)}</div>
    `;
  }

  messagesList.appendChild(messageEl);
}

function displaySystemMessage(text) {
  const messageEl = document.createElement('div');
  messageEl.style.textAlign = 'center';
  messageEl.style.color = 'var(--text-light)';
  messageEl.style.fontSize = '12px';
  messageEl.style.margin = '10px 0';
  messageEl.textContent = text;
  messagesList.appendChild(messageEl);
}

function updateUsersList(users) {
  usersList.innerHTML = '';
  users.forEach(user => {
    const userEl = document.createElement('div');
    userEl.className = 'user-item';
    userEl.textContent = user.username;
    if (user.userId === currentUser?.id) {
      userEl.textContent += ' (You)';
      userEl.style.fontWeight = 'bold';
    }
    usersList.appendChild(userEl);
  });
}

function showTypingIndicator() {
  if (typingIndicator.innerHTML === '') {
    const names = Array.from(typingUsers).join(', ');
    typingIndicator.innerHTML = `
      <span style="font-size: 12px; color: var(--text-light);">${names} ${typingUsers.size === 1 ? 'is' : 'are'} typing</span>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    typingIndicator.classList.add('active');
  }
}

function hideTypingIndicator() {
  typingIndicator.innerHTML = '';
  typingIndicator.classList.remove('active');
}

function scrollToBottom() {
  messagesList.scrollTop = messagesList.scrollHeight;
}

function showNotification(message, type = 'success') {
  notification.textContent = message;
  notification.className = `notification show ${type}`;

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getFileIcon(fileType) {
  if (!fileType) return '📄';
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📕';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  return '📄';
}

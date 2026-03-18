const socket = io();

// DOM ELEMENTS
let authScreen, chatScreen, loginForm, registerForm, loginEmail, loginPassword, loginBtn;
let registerUsername, registerEmail, registerPassword, registerConfirm, registerBtn, authError;
let messageInput, sendBtn, messagesList, typingIndicator;
let fileInput, themeToggle, logoutBtn, uploadProgress, progressBar, notification;
let sendOtpBtn, verifyOtpBtn, otpInput;
let forgotPasswordForm, forgotEmail, sendResetBtn, resetOtpInput, verifyResetOtpBtn;
let newPasswordInput, confirmPasswordInput, resetPasswordBtn;
let allUsersList, conversationsList, noChatSelected, chatWindow, chatWithName;

// STATE
let currentUser = null;
let token = null;
let typingTimeout;
let typingUsers = new Set();
let otpVerified = false;
let selectedUserId = null;
let selectedUsername = null;

// Initialize DOM elements
function initDOM() {
  authScreen = document.getElementById('authScreen');
  chatScreen = document.getElementById('chatScreen');
  loginForm = document.getElementById('loginForm');
  registerForm = document.getElementById('registerForm');
  forgotPasswordForm = document.getElementById('forgotPasswordForm');
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
  allUsersList = document.getElementById('allUsersList');
  conversationsList = document.getElementById('conversationsList');
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
  forgotEmail = document.getElementById('forgotEmail');
  sendResetBtn = document.getElementById('sendResetBtn');
  resetOtpInput = document.getElementById('resetOtpInput');
  verifyResetOtpBtn = document.getElementById('verifyResetOtpBtn');
  newPasswordInput = document.getElementById('newPasswordInput');
  confirmPasswordInput = document.getElementById('confirmPasswordInput');
  resetPasswordBtn = document.getElementById('resetPasswordBtn');
  noChatSelected = document.getElementById('noChatSelected');
  chatWindow = document.getElementById('chatWindow');
  chatWithName = document.getElementById('chatWithName');

  attachEventListeners();
}

function attachEventListeners() {
  loginBtn.addEventListener('click', handleLogin);
  registerBtn.addEventListener('click', handleRegister);
  sendOtpBtn.addEventListener('click', handleSendOTP);
  verifyOtpBtn.addEventListener('click', handleVerifyOTP);
  sendResetBtn.addEventListener('click', handleSendResetOTP);
  verifyResetOtpBtn.addEventListener('click', handleVerifyResetOTP);
  resetPasswordBtn.addEventListener('click', handleResetPassword);
  themeToggle.addEventListener('click', toggleTheme);
  logoutBtn.addEventListener('click', handleLogout);

  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  fileInput.addEventListener('change', handleFileUpload);
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
  loadAllUsers();
  messageInput.focus();
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  token = null;
  otpVerified = false;
  selectedUserId = null;
  
  authScreen.classList.add('active');
  chatScreen.classList.remove('active');
  
  messagesList.innerHTML = '';
  allUsersList.innerHTML = '';
  conversationsList.innerHTML = '';
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

// FORGOT PASSWORD
function showForgotPassword() {
  loginForm.classList.remove('active');
  forgotPasswordForm.classList.add('active');
  authError.classList.remove('show');
}

function backToLogin() {
  forgotPasswordForm.classList.remove('active');
  loginForm.classList.add('active');
  resetForgotPasswordForm();
}

function resetForgotPasswordForm() {
  forgotEmail.value = '';
  resetOtpInput.value = '';
  newPasswordInput.value = '';
  confirmPasswordInput.value = '';
  resetOtpInput.style.display = 'none';
  verifyResetOtpBtn.style.display = 'none';
  newPasswordInput.style.display = 'none';
  confirmPasswordInput.style.display = 'none';
  resetPasswordBtn.style.display = 'none';
  sendResetBtn.disabled = false;
  forgotEmail.disabled = false;
}

async function handleSendResetOTP() {
  const email = forgotEmail.value.trim();
  if (!email) {
    showAuthError('Please enter email');
    return;
  }

  try {
    const response = await fetch('/api/auth/forgot-password', {
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
    resetOtpInput.style.display = 'block';
    verifyResetOtpBtn.style.display = 'block';
    sendResetBtn.disabled = true;
    forgotEmail.disabled = true;
  } catch (error) {
    showAuthError('Error: ' + error.message);
  }
}

async function handleVerifyResetOTP() {
  const email = forgotEmail.value.trim();
  const otp = resetOtpInput.value.trim();

  if (!otp) {
    showAuthError('Please enter OTP');
    return;
  }

  try {
    const response = await fetch('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    const data = await response.json();
    if (!response.ok) {
      showAuthError(data.error || 'Invalid OTP');
      return;
    }

    showAuthError('');
    showNotification('OTP verified! Enter new password');
    newPasswordInput.style.display = 'block';
    confirmPasswordInput.style.display = 'block';
    resetPasswordBtn.style.display = 'block';
    resetOtpInput.style.display = 'none';
    verifyResetOtpBtn.style.display = 'none';
  } catch (error) {
    showAuthError('Error: ' + error.message);
  }
}

async function handleResetPassword() {
  const email = forgotEmail.value.trim();
  const otp = resetOtpInput.value.trim();
  const newPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (!newPassword || !confirmPassword) {
    showAuthError('Please enter both passwords');
    return;
  }

  if (newPassword !== confirmPassword) {
    showAuthError('Passwords do not match');
    return;
  }

  if (newPassword.length < 6) {
    showAuthError('Password must be at least 6 characters');
    return;
  }

  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await response.json();
    if (!response.ok) {
      showAuthError(data.error || 'Password reset failed');
      return;
    }

    showAuthError('');
    showNotification('Password reset successfully! Please login');
    resetForgotPasswordForm();
    backToLogin();
  } catch (error) {
    showAuthError('Error: ' + error.message);
  }
}

// MESSAGING FUNCTIONS
async function loadAllUsers() {
  try {
    const response = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return;

    const users = await response.json();
    displayAllUsers(users);
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

function displayAllUsers(users) {
  allUsersList.innerHTML = '';
  users.forEach(user => {
    if (user.username !== currentUser.username) {
      const userEl = document.createElement('div');
      userEl.className = 'user-item';
      userEl.style.cursor = 'pointer';
      userEl.textContent = user.username;
      userEl.addEventListener('click', () => selectUser(user._id, user.username));
      allUsersList.appendChild(userEl);
    }
  });
}

async function selectUser(userId, username) {
  selectedUserId = userId;
  selectedUsername = username;
  
  noChatSelected.style.display = 'none';
  chatWindow.style.display = 'flex';
  chatWithName.textContent = username;
  messagesList.innerHTML = '';
  
  await loadPrivateMessages(userId);
}

async function loadPrivateMessages(userId) {
  try {
    const response = await fetch(`/api/private-messages/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return;

    const messages = await response.json();
    messagesList.innerHTML = '';
    messages.forEach(msg => displayPrivateMessage(msg));
    scrollToBottom();
  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

function displayPrivateMessage(message) {
  const messageEl = document.createElement('div');
  const isOwn = message.sender.toString() === currentUser.id.toString();
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
      <div class="message-meta">${formatTime(message.timestamp)}</div>
    `;
  } else {
    messageEl.innerHTML = `
      <div class="message-content">${escapeHtml(message.text)}</div>
      <div class="message-meta">${formatTime(message.timestamp)}</div>
    `;
  }

  messagesList.appendChild(messageEl);
}

async function sendMessage() {
  if (!selectedUserId) {
    showNotification('Please select a user first', 'error');
    return;
  }

  const text = messageInput.value.trim();
  if (!text) return;

  try {
    const response = await fetch('/api/private-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receiverId: selectedUserId,
        text: text
      })
    });

    if (response.ok) {
      messageInput.value = '';
      const message = await response.json();
      displayPrivateMessage(message);
      scrollToBottom();
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function handleFileUpload(e) {
  if (!selectedUserId) {
    showNotification('Please select a user first', 'error');
    return;
  }

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
        sendFileMessage(data.fileUrl, data.fileName, data.fileType);
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

async function sendFileMessage(fileUrl, fileName, fileType) {
  try {
    const response = await fetch('/api/private-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receiverId: selectedUserId,
        text: '',
        fileUrl,
        fileName,
        fileType
      })
    });

    if (response.ok) {
      const message = await response.json();
      displayPrivateMessage(message);
      scrollToBottom();
    }
  } catch (error) {
    console.error('Error sending file:', error);
  }
}

function handleTyping() {
  // Typing indicator for private messages (optional)
}

// UTILITY FUNCTIONS
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

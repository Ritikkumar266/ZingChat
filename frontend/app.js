// For production, use the Render backend URL
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://zingchat-backend.onrender.com';

// Helper function to get full API URL
function getApiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

// Initialize Socket.io with correct backend URL
const socket = io(API_BASE_URL);

// DOM ELEMENTS
let authScreen, chatScreen, loginForm, registerForm, loginEmail, loginPassword, loginBtn;
let registerUsername, registerEmail, registerPassword, registerConfirm, registerBtn, authError;
let messageInput, sendBtn, messagesList, typingIndicator;
let fileInput, themeToggle, logoutBtn, uploadProgress, progressBar, notification;
let sendOtpBtn, verifyOtpBtn, otpInput;
let forgotPasswordForm, forgotEmail, sendResetBtn, resetOtpInput, verifyResetOtpBtn;
let newPasswordInput, confirmPasswordInput, resetPasswordBtn;
let allUsersList, conversationsList, noChatSelected, chatWindow, chatWithName;
let togglePassword, emojiBtn, emojiModal, searchInput, userStatus, chatUserAvatar;
let reactionBtn, reactionModal, infoBtn, userInfoModal, callBtn, videoBtn, searchMessagesBtn, messageSearchInput;

// STATE
let currentUser = null;
let token = null;
let typingTimeout;
let typingUsers = new Set();
let otpVerified = false;
let selectedUserId = null;
let selectedUsername = null;
let onlineUsers = new Set();
let conversations = {};
let blockedUsers = new Set();
let mutedUsers = new Set();

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
  togglePassword = document.getElementById('togglePassword');
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
  emojiBtn = document.getElementById('emojiBtn');
  emojiModal = document.getElementById('emojiModal');
  searchInput = document.getElementById('searchInput');
  userStatus = document.getElementById('userStatus');
  chatUserAvatar = document.getElementById('chatUserAvatar');
  reactionBtn = document.getElementById('reactionBtn');
  reactionModal = document.getElementById('reactionModal');
  infoBtn = document.getElementById('infoBtn');
  userInfoModal = document.getElementById('userInfoModal');
  callBtn = document.getElementById('callBtn');
  videoBtn = document.getElementById('videoBtn');
  searchMessagesBtn = document.getElementById('searchMessagesBtn');
  messageSearchInput = document.getElementById('messageSearchInput');

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
  togglePassword.addEventListener('click', () => {
    const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    loginPassword.setAttribute('type', type);
    togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
  });

  // Profile button
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', showProfileModal);
  }

  // DP upload
  const dpUpload = document.getElementById('dpUpload');
  const profileAvatar = document.getElementById('profileAvatar');
  if (profileAvatar) {
    profileAvatar.addEventListener('click', () => dpUpload.click());
  }
  if (dpUpload) {
    dpUpload.addEventListener('change', handleDPUpload);
  }

  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  fileInput.addEventListener('change', handleFileUpload);
  messageInput.addEventListener('input', handleTyping);
  
  // Emoji picker
  emojiBtn.addEventListener('click', () => {
    emojiModal.style.display = emojiModal.style.display === 'none' ? 'block' : 'none';
    reactionModal.style.display = 'none';
  });
  
  // Reaction picker
  reactionBtn.addEventListener('click', () => {
    reactionModal.style.display = reactionModal.style.display === 'none' ? 'block' : 'none';
    emojiModal.style.display = 'none';
  });
  
  // User info button
  infoBtn.addEventListener('click', () => {
    if (selectedUserId) {
      showUserInfo(selectedUserId, selectedUsername);
    }
  });
  
  // Search messages button
  searchMessagesBtn.addEventListener('click', () => {
    const isVisible = messageSearchInput.style.display === 'block';
    messageSearchInput.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      messageSearchInput.focus();
    }
  });
  
  // Search messages input
  messageSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.message').forEach(msg => {
      const text = msg.textContent.toLowerCase();
      msg.style.opacity = text.includes(query) ? '1' : '0.3';
    });
  });
  
  // Call button
  callBtn.addEventListener('click', () => {
    showNotification('Voice call feature coming soon!', 'warning');
  });
  
  // Video button
  videoBtn.addEventListener('click', () => {
    showNotification('Video call feature coming soon!', 'warning');
  });
  
  document.querySelectorAll('.emoji-item').forEach(item => {
    item.addEventListener('click', (e) => {
      messageInput.value += e.target.dataset.emoji;
      messageInput.focus();
      emojiModal.style.display = 'none';
    });
  });
  
  document.querySelectorAll('.reaction-item').forEach(item => {
    item.addEventListener('click', (e) => {
      messageInput.value += e.target.dataset.reaction;
      messageInput.focus();
      reactionModal.style.display = 'none';
    });
  });
  
  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    // Search in all user items (both conversations and all users)
    document.querySelectorAll('.user-item').forEach(item => {
      const username = item.querySelector('.user-name')?.textContent.toLowerCase() || '';
      const shouldShow = username.includes(query) || query === '';
      item.style.display = shouldShow ? 'flex' : 'none';
    });
  });
  
  // Close modals when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#emojiBtn') && !e.target.closest('.emoji-modal')) {
      emojiModal.style.display = 'none';
    }
    if (!e.target.closest('#reactionBtn') && !e.target.closest('.reaction-modal')) {
      reactionModal.style.display = 'none';
    }
  });
}

// INITIALIZATION
window.addEventListener('load', () => {
  initDOM();

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
  }

  // Check for OAuth redirect
  const urlParams = new URLSearchParams(window.location.search);
  const oauthToken = urlParams.get('token');
  const oauthUser = urlParams.get('user');
  
  if (oauthToken && oauthUser) {
    token = oauthToken;
    currentUser = JSON.parse(oauthUser);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    window.history.replaceState({}, document.title, window.location.pathname);
    enterChat();
    return;
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
    const response = await fetch(getApiUrl('/api/auth/send-otp'), {
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
    const response = await fetch(getApiUrl('/api/auth/verify-otp'), {
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
    const response = await fetch(getApiUrl('/api/auth/login'), {
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
    const response = await fetch(getApiUrl('/api/auth/register'), {
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
  
  // Ensure token and user are saved
  if (token) {
    localStorage.setItem('token', token);
  }
  if (currentUser) {
    localStorage.setItem('user', JSON.stringify(currentUser));
  }
  
  loadAllUsers();
  loadGroups();
  messageInput.focus();
  
  // Emit join event with userId
  socket.emit('join', {
    username: currentUser.username,
    userId: currentUser.id
  });
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
    const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
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
    const response = await fetch(getApiUrl('/api/auth/verify-reset-otp'), {
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
    const response = await fetch(getApiUrl('/api/auth/reset-password'), {
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
    const response = await fetch(getApiUrl('/api/users'), {
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
      
      // Create avatar
      const avatar = document.createElement('div');
      avatar.className = 'user-avatar';
      avatar.textContent = user.username.charAt(0).toUpperCase();
      
      // Create user info
      const info = document.createElement('div');
      info.className = 'user-info';
      
      const name = document.createElement('div');
      name.className = 'user-name';
      name.textContent = user.username;
      
      const status = document.createElement('div');
      status.className = 'user-status';
      const dot = document.createElement('span');
      dot.className = `status-dot ${onlineUsers.has(user._id) ? '' : 'offline'}`;
      status.appendChild(dot);
      status.appendChild(document.createTextNode(onlineUsers.has(user._id) ? 'Online' : 'Offline'));
      
      info.appendChild(name);
      info.appendChild(status);
      
      userEl.appendChild(avatar);
      userEl.appendChild(info);
      userEl.addEventListener('click', () => selectUser(user._id, user.username));
      allUsersList.appendChild(userEl);
    }
  });
}

async function selectUser(userId, username) {
  selectedUserId = userId;
  selectedUsername = username;
  
  // Update active state
  document.querySelectorAll('.user-item').forEach(item => {
    item.classList.remove('active');
  });
  event.currentTarget.classList.add('active');
  
  noChatSelected.style.display = 'none';
  chatWindow.style.display = 'flex';
  
  // Update header with avatar and status
  chatWithName.textContent = username;
  chatUserAvatar.textContent = username.charAt(0).toUpperCase();
  userStatus.innerHTML = `<span class="status-dot ${onlineUsers.has(userId) ? '' : 'offline'}"></span>${onlineUsers.has(userId) ? 'Online' : 'Offline'}`;
  
  messagesList.innerHTML = '';
  
  await loadPrivateMessages(userId);
}

async function loadPrivateMessages(userId) {
  try {
    const response = await fetch(getApiUrl(`/api/private-messages/${userId}`), {
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
  messageEl.className = `message ${isOwn ? 'sent' : 'received'}`;

  if (message.fileUrl) {
    const fileIcon = getFileIcon(message.fileType);
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = `
      <div class="file-message">
        <div class="file-icon">${fileIcon}</div>
        <div class="file-info">
          <div class="file-name">${escapeHtml(message.fileName)}</div>
          <a href="${message.fileUrl}" download style="color: inherit; text-decoration: underline; font-size: 12px;">Download</a>
        </div>
      </div>
    `;
    messageEl.appendChild(bubble);
  } else {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = message.text;
    
    // Add hover effect for reactions
    bubble.style.cursor = 'pointer';
    bubble.addEventListener('mouseenter', () => {
      bubble.style.transform = 'scale(1.02)';
    });
    bubble.addEventListener('mouseleave', () => {
      bubble.style.transform = 'scale(1)';
    });
    
    messageEl.appendChild(bubble);
  }

  const time = document.createElement('div');
  time.className = 'message-time';
  time.textContent = formatTime(message.timestamp);
  messageEl.appendChild(time);

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
    const response = await fetch(getApiUrl('/api/private-messages'), {
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

    xhr.open('POST', getApiUrl('/api/upload'));
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
    const response = await fetch(getApiUrl('/api/private-messages'), {
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
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) {
    return `Today ${time}`;
  } else if (isYesterday) {
    return `Yesterday ${time}`;
  } else {
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dateStr} ${time}`;
  }
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


// ============ SOCKET.IO LISTENERS ============

// Listen for user online status
socket.on('userOnline', (data) => {
  onlineUsers.add(data.userId);
  loadAllUsers();
});

// Listen for user offline status
socket.on('userOffline', (data) => {
  onlineUsers.delete(data.userId);
  loadAllUsers();
  
  // Update current chat status if applicable
  if (selectedUserId === data.userId) {
    userStatus.innerHTML = `<span class="status-dot offline"></span>Offline`;
  }
});

// Listen for new private messages
socket.on('privateMessageReceived', (message) => {
  // Convert to strings for comparison
  const senderId = message.sender?.toString ? message.sender.toString() : message.sender;
  const receiverId = message.receiver?.toString ? message.receiver.toString() : message.receiver;
  const selectedId = selectedUserId?.toString ? selectedUserId.toString() : selectedUserId;
  
  if (senderId === selectedId || receiverId === selectedId) {
    displayPrivateMessage(message);
    scrollToBottom();
  }
});

// Listen for typing indicator
socket.on('userTyping', (data) => {
  if (data.userId === selectedUserId && data.isTyping) {
    typingIndicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    typingIndicator.style.display = 'flex';
    scrollToBottom();
  } else {
    typingIndicator.style.display = 'none';
  }
});


// ============ USER INFO FUNCTION ============

function showUserInfo(userId, username) {
  const userInfoModal = document.getElementById('userInfoModal');
  const userInfoAvatar = document.getElementById('userInfoAvatar');
  const userInfoName = document.getElementById('userInfoName');
  const userInfoEmail = document.getElementById('userInfoEmail');
  const userInfoStatusBig = document.getElementById('userInfoStatusBig');
  const userInfoStatusText = document.getElementById('userInfoStatusText');
  const userInfoJoined = document.getElementById('userInfoJoined');
  const blockUserBtn = document.getElementById('blockUserBtn');
  const muteUserBtn = document.getElementById('muteUserBtn');
  
  // Set user info
  userInfoAvatar.textContent = username.charAt(0).toUpperCase();
  userInfoName.textContent = username;
  userInfoEmail.textContent = 'User ID: ' + userId;
  
  const isOnline = onlineUsers.has(userId);
  userInfoStatusBig.innerHTML = `<span class="status-dot ${isOnline ? '' : 'offline'}"></span>${isOnline ? 'Online' : 'Offline'}`;
  userInfoStatusText.textContent = isOnline ? 'Active now' : 'Last seen recently';
  
  const joinDate = new Date().toLocaleDateString();
  userInfoJoined.textContent = joinDate;
  
  // Block/Unblock button
  if (blockedUsers.has(userId)) {
    blockUserBtn.textContent = '✅ Unblock User';
    blockUserBtn.style.background = 'var(--success)';
  } else {
    blockUserBtn.textContent = '🚫 Block User';
    blockUserBtn.style.background = 'var(--danger)';
  }
  
  blockUserBtn.onclick = () => {
    if (blockedUsers.has(userId)) {
      blockedUsers.delete(userId);
      showNotification('User unblocked', 'success');
    } else {
      blockedUsers.add(userId);
      showNotification('User blocked', 'success');
    }
    showUserInfo(userId, username);
  };
  
  // Mute/Unmute button
  if (mutedUsers.has(userId)) {
    muteUserBtn.textContent = '🔔 Unmute Notifications';
    muteUserBtn.style.background = 'var(--success)';
  } else {
    muteUserBtn.textContent = '🔇 Mute Notifications';
    muteUserBtn.style.background = 'var(--warning)';
  }
  
  muteUserBtn.onclick = () => {
    if (mutedUsers.has(userId)) {
      mutedUsers.delete(userId);
      showNotification('Notifications enabled', 'success');
    } else {
      mutedUsers.add(userId);
      showNotification('Notifications muted', 'success');
    }
    showUserInfo(userId, username);
  };
  
  userInfoModal.style.display = 'flex';
}

// ============ BLOCK/MUTE FUNCTIONS ============

function isUserBlocked(userId) {
  return blockedUsers.has(userId);
}

function isUserMuted(userId) {
  return mutedUsers.has(userId);
}


// ============ GROUP CHAT FUNCTIONS ============

let selectedGroupId = null;
let groups = [];

// Initialize group chat
function initGroupChat() {
  const createGroupBtn = document.getElementById('createGroupBtn');
  if (!createGroupBtn) {
    console.error('createGroupBtn not found');
    return;
  }
  
  const createGroupModal = document.getElementById('createGroupModal');
  const createGroupSubmitBtn = document.getElementById('createGroupSubmitBtn');
  
  createGroupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Create group button clicked');
    createGroupModal.style.display = 'flex';
    loadUsersForGroupCreation();
  });
  
  createGroupSubmitBtn.addEventListener('click', handleCreateGroup);
  
  // Close modal when clicking outside
  createGroupModal.addEventListener('click', (e) => {
    if (e.target === createGroupModal) {
      createGroupModal.style.display = 'none';
    }
  });
}

async function loadUsersForGroupCreation() {
  try {
    const response = await fetch(getApiUrl('/api/users'), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return;

    const users = await response.json();
    const groupMembersList = document.getElementById('groupMembersList');
    groupMembersList.innerHTML = '';
    
    users.forEach(user => {
      if (user.username !== currentUser.username) {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.padding = '8px';
        label.style.cursor = 'pointer';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = user._id;
        checkbox.style.marginRight = '10px';
        
        const span = document.createElement('span');
        span.textContent = user.username;
        
        label.appendChild(checkbox);
        label.appendChild(span);
        groupMembersList.appendChild(label);
      }
    });
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

async function handleCreateGroup() {
  const groupName = document.getElementById('groupName').value.trim();
  const groupDescription = document.getElementById('groupDescription').value.trim();
  const groupError = document.getElementById('groupError');
  
  if (!groupName) {
    groupError.textContent = 'Group name is required';
    groupError.style.display = 'block';
    return;
  }
  
  const memberCheckboxes = document.querySelectorAll('#groupMembersList input[type="checkbox"]:checked');
  const memberIds = Array.from(memberCheckboxes).map(cb => cb.value);
  
  try {
    const response = await fetch(getApiUrl('/api/groups'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: groupName,
        description: groupDescription,
        memberIds
      })
    });

    if (!response.ok) {
      const data = await response.json();
      groupError.textContent = data.error || 'Failed to create group';
      groupError.style.display = 'block';
      return;
    }

    showNotification('Group created successfully!', 'success');
    document.getElementById('createGroupModal').style.display = 'none';
    document.getElementById('groupName').value = '';
    document.getElementById('groupDescription').value = '';
    groupError.style.display = 'none';
    
    loadGroups();
  } catch (error) {
    groupError.textContent = 'Error: ' + error.message;
    groupError.style.display = 'block';
  }
}

async function loadGroups() {
  try {
    const response = await fetch(getApiUrl('/api/groups'), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return;

    groups = await response.json();
    displayGroups();
  } catch (error) {
    console.error('Error loading groups:', error);
  }
}

function displayGroups() {
  const conversationsList = document.getElementById('conversationsList');
  conversationsList.innerHTML = '';
  
  groups.forEach(group => {
    const groupEl = document.createElement('div');
    groupEl.className = 'user-item';
    if (selectedGroupId === group._id) {
      groupEl.classList.add('active');
    }
    
    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.textContent = group.name.charAt(0).toUpperCase();
    avatar.style.background = '#667eea';
    
    const info = document.createElement('div');
    info.className = 'user-info';
    
    const name = document.createElement('div');
    name.className = 'user-name';
    name.textContent = group.name;
    
    const memberCount = document.createElement('div');
    memberCount.className = 'user-status';
    memberCount.textContent = `👥 ${group.members.length} members`;
    
    info.appendChild(name);
    info.appendChild(memberCount);
    
    groupEl.appendChild(avatar);
    groupEl.appendChild(info);
    groupEl.addEventListener('click', () => selectGroup(group._id, group.name));
    
    conversationsList.appendChild(groupEl);
  });
}

async function selectGroup(groupId, groupName) {
  selectedGroupId = groupId;
  selectedUserId = null;
  
  document.querySelectorAll('.user-item').forEach(item => {
    item.classList.remove('active');
  });
  event.currentTarget.classList.add('active');
  
  const noChatSelected = document.getElementById('noChatSelected');
  const chatWindow = document.getElementById('chatWindow');
  const chatWithName = document.getElementById('chatWithName');
  const chatUserAvatar = document.getElementById('chatUserAvatar');
  const userStatus = document.getElementById('userStatus');
  
  noChatSelected.style.display = 'none';
  chatWindow.style.display = 'flex';
  
  chatWithName.textContent = groupName;
  chatUserAvatar.textContent = groupName.charAt(0).toUpperCase();
  chatUserAvatar.style.background = '#667eea';
  userStatus.textContent = '👥 Group Chat';
  
  const messagesList = document.getElementById('messagesList');
  messagesList.innerHTML = '';
  
  // Join group socket room
  socket.emit('joinGroup', { groupId });
  
  await loadGroupMessages(groupId);
}

async function loadGroupMessages(groupId) {
  try {
    const response = await fetch(getApiUrl(`/api/groups/${groupId}/messages`), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return;

    const messages = await response.json();
    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '';
    messages.forEach(msg => displayGroupMessage(msg));
    scrollToBottom();
  } catch (error) {
    console.error('Error loading group messages:', error);
  }
}

function displayGroupMessage(message) {
  const messageEl = document.createElement('div');
  const isOwn = message.sender.toString() === currentUser.id.toString();
  messageEl.className = `message ${isOwn ? 'sent' : 'received'}`;

  const senderName = document.createElement('div');
  senderName.className = 'message-sender';
  senderName.textContent = message.senderUsername;
  senderName.style.fontSize = '12px';
  senderName.style.opacity = '0.7';
  senderName.style.marginBottom = '4px';
  
  if (!isOwn) {
    messageEl.appendChild(senderName);
  }

  if (message.fileUrl) {
    const fileIcon = getFileIcon(message.fileType);
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = `
      <div class="file-message">
        <div class="file-icon">${fileIcon}</div>
        <div class="file-info">
          <div class="file-name">${escapeHtml(message.fileName)}</div>
          <a href="${message.fileUrl}" download style="color: inherit; text-decoration: underline; font-size: 12px;">Download</a>
        </div>
      </div>
    `;
    messageEl.appendChild(bubble);
  } else {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = message.text;
    messageEl.appendChild(bubble);
  }

  const time = document.createElement('div');
  time.className = 'message-time';
  time.textContent = formatTime(message.timestamp);
  messageEl.appendChild(time);

  const messagesList = document.getElementById('messagesList');
  messagesList.appendChild(messageEl);
}
async function sendMessage() {
  if (selectedGroupId) {
    // Send group message
    const text = messageInput.value.trim();
    if (!text) return;

    try {
      const response = await fetch(getApiUrl(`/api/groups/${selectedGroupId}/messages`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        messageInput.value = '';
        // Don't display here - let socket.io handle it for real-time sync
        scrollToBottom();
        
        // Emit via socket
        socket.emit('groupMessage', {
          groupId: selectedGroupId,
          text: text,
          fileUrl: null,
          fileName: null,
          fileType: null
        });
      } else {
        showNotification('Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Error sending group message:', error);
      showNotification('Error sending message', 'error');
    }
  } else if (selectedUserId) {
    // Send private message
    const text = messageInput.value.trim();
    if (!text) return;

    try {
      const response = await fetch(getApiUrl('/api/private-messages'), {
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
        // Don't display here - let socket.io handle it for real-time sync
        scrollToBottom();
        
        // Emit via Socket.io for real-time delivery
        socket.emit('privateMessage', {
          receiverId: selectedUserId,
          text: text
        });
      } else {
        showNotification('Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Error sending message', 'error');
    }
  } else {
    showNotification('Please select a user or group first', 'error');
  }
}

// Socket.io listeners for group chat
socket.on('groupMessage', (message) => {
  if (message.groupId === selectedGroupId) {
    displayGroupMessage(message);
    scrollToBottom();
  }
});

socket.on('groupUserTyping', (data) => {
  if (selectedGroupId) {
    const typingIndicator = document.getElementById('typingIndicator');
    if (data.isTyping) {
      typingIndicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      `;
      typingIndicator.style.display = 'flex';
      scrollToBottom();
    } else {
      typingIndicator.style.display = 'none';
    }
  }
});

// Initialize group chat when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing group chat');
  initGroupChat();
});


// ============ PROFILE FUNCTIONS ============

function showProfileModal() {
  const profileModal = document.getElementById('profileModal');
  const profileUsername = document.getElementById('profileUsername');
  const profileEmail = document.getElementById('profileEmail');
  const profileJoined = document.getElementById('profileJoined');
  const profileAvatar = document.getElementById('profileAvatar');
  
  if (currentUser) {
    profileUsername.value = currentUser.username;
    profileEmail.value = currentUser.email;
    profileJoined.value = new Date().toLocaleDateString();
    
    // Set avatar
    if (currentUser.avatar) {
      profileAvatar.style.backgroundImage = `url(${currentUser.avatar})`;
      profileAvatar.style.backgroundSize = 'cover';
      profileAvatar.textContent = '';
    } else {
      profileAvatar.style.backgroundImage = 'linear-gradient(135deg, #25d366, #128c7e)';
      profileAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
    }
  }
  
  profileModal.style.display = 'flex';
}

async function handleDPUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showNotification('Image size must be less than 5MB', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(getApiUrl('/api/upload'), {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      
      // Update user avatar
      currentUser.avatar = data.fileUrl;
      localStorage.setItem('user', JSON.stringify(currentUser));
      
      // Update avatar display
      const profileAvatar = document.getElementById('profileAvatar');
      profileAvatar.style.backgroundImage = `url(${data.fileUrl})`;
      profileAvatar.style.backgroundSize = 'cover';
      profileAvatar.textContent = '';
      
      showNotification('Profile picture updated!', 'success');
    } else {
      showNotification('Failed to upload image', 'error');
    }
  } catch (error) {
    console.error('Upload error:', error);
    showNotification('Error uploading image', 'error');
  }
}

import { api } from './api-client.js';

let currentUser = null;

export function getCurrentUser() {
  return currentUser;
}

export async function checkSession() {
  try {
    currentUser = await api.auth.me();
    if (currentUser) {
      document.dispatchEvent(new CustomEvent('auth:login', { detail: { user: currentUser } }));
    } else {
      document.dispatchEvent(new CustomEvent('auth:logout'));
    }
  } catch (err) {
    console.error('Session check failed', err);
  }
}

export function initAuthUI() {
  const authButton = document.getElementById('auth-button');
  const authLabel = document.getElementById('auth-label');
  const authModal = document.getElementById('auth-modal');
  const closeAuthBtn = document.getElementById('close-auth-modal');
  const authForm = document.getElementById('auth-form');
  const authToggleMode = document.getElementById('auth-toggle-mode');
  const authTitle = document.getElementById('auth-modal-title');
  const authEyebrow = document.getElementById('auth-eyebrow');
  const authSubmit = document.getElementById('auth-submit');
  const globalError = document.getElementById('auth-global-error');
  
  let isLogin = true;

  const deleteBtn = document.getElementById('delete-account-button');
  const deleteModal = document.getElementById('delete-modal');
  const closeDeleteBtn = document.getElementById('close-delete-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete-button');
  const cancelDeleteBtn = document.getElementById('cancel-delete-button');

  function updateUIState() {
    if (currentUser) {
      authLabel.textContent = 'Logout';
      authButton.setAttribute('aria-label', 'Logout');
      if (deleteBtn) {
        deleteBtn.hidden = false;
        deleteBtn.style.display = 'inline-flex';
      }
    } else {
      authLabel.textContent = 'Login';
      authButton.setAttribute('aria-label', 'Login');
      if (deleteBtn) {
        deleteBtn.hidden = true;
        deleteBtn.style.display = 'none';
      }
    }
  }

  document.addEventListener('auth:login', (e) => {
    currentUser = e.detail.user;
    updateUIState();
    if (authModal) authModal.hidden = true;
  });

  document.addEventListener('auth:logout', () => {
    currentUser = null;
    updateUIState();
    if (deleteModal) deleteModal.hidden = true;
  });

  deleteBtn?.addEventListener('click', () => {
    if (deleteModal) deleteModal.hidden = false;
    confirmDeleteBtn?.focus();
  });

  closeDeleteBtn?.addEventListener('click', () => {
    if (deleteModal) deleteModal.hidden = true;
    deleteBtn?.focus();
  });

  cancelDeleteBtn?.addEventListener('click', () => {
    if (deleteModal) deleteModal.hidden = true;
    deleteBtn?.focus();
  });

  confirmDeleteBtn?.addEventListener('click', async () => {
    try {
      await api.auth.deleteAccount();
      if (deleteModal) deleteModal.hidden = true;
    } catch (err) {
      console.error('Failed to delete account', err);
    }
  });

  function setMode(loginMode) {
    isLogin = loginMode;
    if (isLogin) {
      authEyebrow.textContent = 'WELCOME BACK';
      authTitle.innerHTML = 'Sign in to<br/><span>sync progress.</span>';
      authSubmit.textContent = 'Login';
      authToggleMode.textContent = 'Need an account? Register';
    } else {
      authEyebrow.textContent = 'JOIN US';
      authTitle.innerHTML = 'Create an account<br/><span>to sync progress.</span>';
      authSubmit.textContent = 'Register';
      authToggleMode.textContent = 'Already have an account? Login';
    }
    globalError.textContent = '';
  }

  authButton?.addEventListener('click', async () => {
    if (currentUser) {
      await api.auth.logout();
    } else {
      setMode(true);
      authModal.hidden = false;
      document.getElementById('auth-email').focus();
    }
  });

  closeAuthBtn?.addEventListener('click', () => {
    authModal.hidden = true;
  });

  authToggleMode?.addEventListener('click', () => {
    setMode(!isLogin);
  });

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    globalError.textContent = '';
    
    const prevText = authSubmit.textContent;
    authSubmit.textContent = 'Working...';
    authSubmit.disabled = true;

    try {
      let user;
      if (isLogin) {
        user = await api.auth.login(email, password);
      } else {
        user = await api.auth.register(email, password);
      }

      currentUser = user;
      document.dispatchEvent(new CustomEvent('auth:login', { detail: { user } }));
    } catch (err) {
      globalError.textContent = err.message;
    } finally {
      authSubmit.textContent = prevText;
      authSubmit.disabled = false;
    }
  });
}

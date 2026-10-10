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

  let authReturnFocus = null;
  let deleteReturnFocus = null;

  function trapFocus(container, onEscape) {
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = [...container.querySelectorAll('button:not([disabled]), input:not([disabled]), a:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((el) => !el.hidden && el.style.display !== 'none');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === container)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  function closeDelete() {
    if (deleteModal) deleteModal.hidden = true;
    deleteReturnFocus?.focus();
  }

  function closeAuth() {
    if (authModal) authModal.hidden = true;
    authReturnFocus?.focus();
  }

  if (authModal) trapFocus(authModal, closeAuth);
  if (deleteModal) trapFocus(deleteModal, closeDelete);

  deleteBtn?.addEventListener('click', () => {
    deleteReturnFocus = document.activeElement;
    if (deleteModal) deleteModal.hidden = false;
    confirmDeleteBtn?.focus();
  });

  closeDeleteBtn?.addEventListener('click', closeDelete);
  cancelDeleteBtn?.addEventListener('click', closeDelete);

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
    const emailErr = document.getElementById('auth-email-error');
    if (emailErr) emailErr.textContent = '';
    const pwdErr = document.getElementById('auth-password-error');
    if (pwdErr) pwdErr.textContent = '';
  }

  authButton?.addEventListener('click', async () => {
    if (currentUser) {
      await api.auth.logout();
    } else {
      authReturnFocus = document.activeElement;
      setMode(true);
      authModal.hidden = false;
      document.getElementById('auth-email').focus();
    }
  });

  closeAuthBtn?.addEventListener('click', closeAuth);

  authToggleMode?.addEventListener('click', () => {
    setMode(!isLogin);
  });

  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const emailErr = document.getElementById('auth-email-error');
  const pwdErr = document.getElementById('auth-password-error');

  emailInput?.addEventListener('input', () => {
    if (emailErr) emailErr.textContent = '';
    globalError.textContent = '';
  });
  passwordInput?.addEventListener('input', () => {
    if (pwdErr) pwdErr.textContent = '';
    globalError.textContent = '';
  });

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    globalError.textContent = '';
    if (emailErr) emailErr.textContent = '';
    if (pwdErr) pwdErr.textContent = '';

    if (!email) {
      if (emailErr) emailErr.textContent = 'Email address is required.';
      emailInput.focus();
      return;
    }
    if (password.length < 8) {
      if (pwdErr) pwdErr.textContent = 'Password must be at least 8 characters.';
      passwordInput.focus();
      return;
    }
    
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
      if (err.message?.toLowerCase().includes('password')) {
        if (pwdErr) pwdErr.textContent = err.message;
        passwordInput.focus();
      } else {
        if (emailErr) emailErr.textContent = err.message;
        emailInput.focus();
      }
    } finally {
      authSubmit.textContent = prevText;
      authSubmit.disabled = false;
    }
  });
}

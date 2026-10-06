import { api } from './api-client.js';
import { checkSession, initAuthUI, getCurrentUser } from './auth.js';

class DemoTabs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.addEventListener('click', this.onClick);
    this.shadowRoot.addEventListener('keydown', this.onKeyDown);
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this.onClick);
    this.shadowRoot.removeEventListener('keydown', this.onKeyDown);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block}
        .tab-buttons{display:flex;gap:6px;margin-bottom:12px}
        button{padding:.42rem .72rem;border:1px solid var(--line);border-radius:8px;background:var(--surface-muted);color:var(--muted);cursor:pointer;font-family:inherit;font-size:.7rem;font-weight:700;line-height:1.2;transition:background-color 160ms ease,color 160ms ease}
        button[aria-selected="true"]{border-color:var(--accent);background:var(--accent);color:var(--accent-ink)}
        button:focus-visible{outline:3px solid var(--accent-strong);outline-offset:2px}
        .panel{min-height:115px;padding:.9rem;border:1px solid var(--line);border-radius:12px;background:var(--surface-muted);color:var(--text);font-size:.82rem;line-height:1.6}
        .panel p{margin:.45rem 0 0;color:var(--muted);font-size:.72rem}
        [hidden]{display:none!important}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important}}
      </style>
      <div class="tab-buttons" role="tablist" aria-label="Widget examples">
        <button id="widget-tab-a" type="button" role="tab" aria-selected="true" aria-controls="widget-panel-a" data-id="a">A / Switch</button>
        <button id="widget-tab-b" type="button" role="tab" aria-selected="false" aria-controls="widget-panel-b" data-id="b" tabindex="-1">B / DOM</button>
        <button id="widget-tab-c" type="button" role="tab" aria-selected="false" aria-controls="widget-panel-c" data-id="c" tabindex="-1">C / State</button>
      </div>
      <div id="widget-panel-a" class="panel" role="tabpanel" aria-labelledby="widget-tab-a" data-panel="a">One listener can manage a whole group of controls.<p>Click another tab or use the arrow keys.</p></div>
      <div id="widget-panel-b" class="panel" role="tabpanel" aria-labelledby="widget-tab-b" data-panel="b" hidden>DOM manipulation changes what the browser presents.<p>Each panel is linked to its tab with ARIA attributes.</p></div>
      <div id="widget-panel-c" class="panel" role="tabpanel" aria-labelledby="widget-tab-c" data-panel="c" hidden>Small pieces of state make interactive UI feel alive.<p>This selected tab is the component's current state.</p></div>
    `;
  }

  onClick(event) {
    const button = event.target.closest?.('button[data-id]');
    if (button && this.shadowRoot.contains(button)) this.show(button.dataset.id);
  }

  onKeyDown(event) {
    const buttons = [...this.shadowRoot.querySelectorAll('[role="tab"]')];
    const currentIndex = buttons.indexOf(event.target);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % buttons.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = buttons.length - 1;
    else return;

    event.preventDefault();
    buttons[nextIndex].focus();
    this.show(buttons[nextIndex].dataset.id);
  }

  show(id) {
    const buttons = [...this.shadowRoot.querySelectorAll('[role="tab"]')];
    if (!buttons.some((button) => button.dataset.id === id)) return;

    buttons.forEach((button) => {
      const selected = button.dataset.id === id;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    this.shadowRoot.querySelectorAll('[role="tabpanel"]').forEach((panel) => {
      panel.hidden = panel.dataset.panel !== id;
    });
  }
}

class DragList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.draggedItem = null;
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  connectedCallback() {
    this.render();
    this.list = this.shadowRoot.getElementById('list');
    this.list.addEventListener('dragstart', this.onDragStart);
    this.list.addEventListener('dragover', this.onDragOver);
    this.list.addEventListener('drop', this.onDrop);
    this.list.addEventListener('dragend', this.onDragEnd);
  }

  disconnectedCallback() {
    this.list?.removeEventListener('dragstart', this.onDragStart);
    this.list?.removeEventListener('dragover', this.onDragOver);
    this.list?.removeEventListener('drop', this.onDrop);
    this.list?.removeEventListener('dragend', this.onDragEnd);
    this.draggedItem = null;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block}
        ul{display:grid;gap:8px;list-style:none;padding:0;margin:0}
        li{display:flex;align-items:center;gap:10px;min-height:42px;padding:8px 10px;border:1px solid var(--line);border-radius:9px;background:var(--surface-muted);color:var(--text);cursor:grab;font-size:.78rem;transition:transform 140ms ease,border-color 140ms ease,background-color 140ms ease}
        li:active{cursor:grabbing}
        li.dragging{opacity:.45}
        li.drop-target{border-color:var(--accent-strong);background:color-mix(in srgb,var(--accent) 20%,var(--surface-muted))}
        .grip{color:var(--muted);font:700 .8rem/1 monospace}
        [hidden]{display:none!important}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important}}
      </style>
      <ul id="list" aria-label="Reorderable example items">
        <li draggable="true"><span class="grip" aria-hidden="true">⠿</span> Item 1</li>
        <li draggable="true"><span class="grip" aria-hidden="true">⠿</span> Item 2</li>
        <li draggable="true"><span class="grip" aria-hidden="true">⠿</span> Item 3</li>
      </ul>
      <p class="sr-only" aria-live="polite" id="status"></p>
    `;
  }

  getListItem(target) {
    const item = target instanceof Element ? target.closest('li[draggable="true"]') : null;
    return item && this.list.contains(item) ? item : null;
  }

  onDragStart(event) {
    const item = this.getListItem(event.target);
    if (!item) return;

    this.draggedItem = item;
    item.classList.add('dragging');
    event.dataTransfer?.setData('text/plain', String([...this.list.children].indexOf(item)));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event) {
    const target = this.getListItem(event.target);
    if (!this.draggedItem || !target) return;

    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.list.querySelectorAll('.drop-target').forEach((item) => item.classList.remove('drop-target'));
    if (target !== this.draggedItem) target.classList.add('drop-target');
  }

  onDrop(event) {
    const target = this.getListItem(event.target);
    if (!this.draggedItem || !target) return;

    event.preventDefault();
    if (target !== this.draggedItem) {
      const items = [...this.list.children];
      if (items.indexOf(this.draggedItem) < items.indexOf(target)) target.after(this.draggedItem);
      else target.before(this.draggedItem);
      this.shadowRoot.getElementById('status').textContent = 'Item order updated.';
    }
    this.onDragEnd();
  }

  onDragEnd() {
    this.list?.querySelectorAll('.dragging, .drop-target').forEach((item) => {
      item.classList.remove('dragging', 'drop-target');
    });
    this.draggedItem = null;
  }
}

class TodoApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.storageKey = 'demo-todos-v1';
    this.onSubmit = this.onSubmit.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onStorage = this.onStorage.bind(this);
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.addEventListener('submit', this.onSubmit);
    this.shadowRoot.addEventListener('click', this.onClick);
    window.addEventListener('storage', this.onStorage);
    this.onAuth = () => setTimeout(() => this.renderList(), 0);
    document.addEventListener('auth:login', this.onAuth);
    document.addEventListener('auth:logout', this.onAuth);
    this.renderList();
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('submit', this.onSubmit);
    this.shadowRoot.removeEventListener('click', this.onClick);
    window.removeEventListener('storage', this.onStorage);
    document.removeEventListener('auth:login', this.onAuth);
    document.removeEventListener('auth:logout', this.onAuth);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block}
        .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        form{display:flex;gap:8px}
        input{width:100%;min-width:0;min-height:44px;flex:1;padding:.65rem .8rem;border:1px solid var(--line);border-radius:9px;background:var(--surface);color:var(--text);font:inherit;font-size:.8rem}
        input::placeholder{color:var(--muted)}
        input:focus-visible,button:focus-visible{outline:3px solid var(--accent-strong);outline-offset:2px}
        form button,.remove{display:inline-flex;min-height:42px;align-items:center;justify-content:center;padding:.55rem .85rem;border:1px solid transparent;border-radius:9px;background:var(--accent);color:var(--accent-ink);cursor:pointer;font-family:inherit;font-size:.76rem;font-weight:700;line-height:1;transition:transform 150ms ease,background-color 150ms ease}
        form button:hover,.remove:hover{background:var(--accent-strong);transform:translateY(-1px)}
        ul{display:grid;gap:6px;padding:0;margin:14px 0 0;list-style:none}
        li{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:45px;padding:6px 7px 6px 12px;border:1px solid var(--line);border-radius:9px;background:var(--surface-muted);color:var(--text);font-size:.78rem}
        .remove{min-height:30px;padding:.35rem .55rem;border-color:var(--line);background:var(--surface);color:var(--muted);font-size:.68rem}
        .empty{padding:1rem;border:1px dashed var(--line);border-radius:9px;color:var(--muted);font-size:.76rem;text-align:center}
        .status{min-height:1.2rem;margin:.65rem 0 0;color:var(--muted);font-size:.7rem}
        [hidden]{display:none!important}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important}}
      </style>
      <form id="form">
        <label class="sr-only" for="input">New task</label>
        <input id="input" name="todo" maxlength="160" autocomplete="off" placeholder="Something worth remembering…" />
        <button type="submit">Add task <span aria-hidden="true">＋</span></button>
      </form>
      <p id="status" class="status" role="status" aria-live="polite"></p>
      <ul id="list" aria-label="Saved tasks"></ul>
    `;
  }

  async readTodos() {
    if (getCurrentUser()) {
      try {
        const todos = await api.todos.list();
        return { ok: true, todos: todos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) };
      } catch (error) {
        return { ok: false, error };
      }
    }

    let raw;
    try {
      raw = localStorage.getItem(this.storageKey);
    } catch (error) {
      return { ok: false, error };
    }

    if (raw === null) return { ok: true, todos: [] };

    try {
      const todos = JSON.parse(raw);
      if (!Array.isArray(todos) || todos.some((todo) => typeof todo !== 'string')) {
        return { ok: false, error: new Error('Saved tasks are not in the expected list format.') };
      }
      return { ok: true, todos };
    } catch (error) {
      return { ok: false, error };
    }
  }

  async writeTodosLocal(todos) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(todos));
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  reportStorageError(error) {
    const status = this.shadowRoot.getElementById('status');
    status.textContent = 'Tasks could not be saved or read. Check your connection or storage permissions.';
    console.error('Todo error:', error);
  }

  async onSubmit(event) {
    if (event.target.id !== 'form') return;
    event.preventDefault();

    const input = this.shadowRoot.getElementById('input');
    const value = input.value.trim();
    if (!value) {
      input.focus();
      return;
    }
    
    const submitBtn = this.shadowRoot.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    if (getCurrentUser()) {
      try {
        await api.todos.create(value);
        input.value = '';
        await this.renderList();
      } catch (error) {
        this.reportStorageError(error);
      }
    } else {
      const loaded = await this.readTodos();
      if (!loaded.ok) {
        this.reportStorageError(loaded.error);
        submitBtn.disabled = false;
        return;
      }
      const result = await this.writeTodosLocal([...loaded.todos, value]);
      if (!result.ok) {
        this.reportStorageError(result.error);
        submitBtn.disabled = false;
        return;
      }
      input.value = '';
      await this.renderList();
    }
    submitBtn.disabled = false;
    input.focus();
  }

  async onClick(event) {
    const button = event.target.closest?.('button[data-remove]');
    if (!button || !this.shadowRoot.contains(button)) return;

    button.disabled = true;

    if (getCurrentUser()) {
      try {
        await api.todos.remove(button.dataset.remove);
        await this.renderList();
      } catch (error) {
        this.reportStorageError(error);
        button.disabled = false;
        return;
      }
    } else {
      const loaded = await this.readTodos();
      if (!loaded.ok) {
        this.reportStorageError(loaded.error);
        button.disabled = false;
        return;
      }

      const index = Number(button.dataset.remove);
      if (!Number.isInteger(index) || index < 0 || index >= loaded.todos.length) return;

      const todos = loaded.todos.filter((_, itemIndex) => itemIndex !== index);
      const result = await this.writeTodosLocal(todos);
      if (!result.ok) {
        this.reportStorageError(result.error);
        button.disabled = false;
        return;
      }

      await this.renderList();
      const nextRemoveButton = this.shadowRoot.querySelector(`button[data-remove="${Math.min(index, todos.length - 1)}"]`);
      (nextRemoveButton || this.shadowRoot.getElementById('input')).focus();
    }
  }

  async onStorage(event) {
    if (event.key === this.storageKey || event.key === null) await this.renderList();
  }

  async renderList() {
    const list = this.shadowRoot.getElementById('list');
    const status = this.shadowRoot.getElementById('status');
    status.textContent = 'Loading...';
    
    const loaded = await this.readTodos();
    list.replaceChildren();

    if (!loaded.ok) {
      this.reportStorageError(loaded.error);
      return;
    }

    if (loaded.todos.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'Nothing on the list yet. Add a task to get started.';
      list.append(empty);
      status.textContent = '';
      return;
    }

    loaded.todos.forEach((todo, index) => {
      const item = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = typeof todo === 'string' ? todo : todo.text;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.dataset.remove = typeof todo === 'string' ? String(index) : todo.id;
      remove.setAttribute('aria-label', `Remove task: ${text.textContent}`);
      remove.textContent = 'Remove';
      item.append(text, remove);
      list.append(item);
    });
    status.textContent = `${loaded.todos.length} ${loaded.todos.length === 1 ? 'task' : 'tasks'} saved ${getCurrentUser() ? 'to your account' : 'in this browser'}.`;
  }
}



class DomInspector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.active = false;
    this.originalCursor = '';
    this.highlightedElement = null;
    this.highlightTimer = null;
    this.onToggle = this.onToggle.bind(this);
    this.onDocumentClick = this.onDocumentClick.bind(this);
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.getElementById('toggle').addEventListener('click', this.onToggle);
  }

  disconnectedCallback() {
    this.shadowRoot.getElementById('toggle')?.removeEventListener('click', this.onToggle);
    this.setActive(false);
    this.clearHighlight();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block}
        p{color:var(--muted);font-size:.78rem;line-height:1.6}
        #out{min-height:116px;padding:1rem;border:1px solid var(--line);border-radius:12px;background:var(--surface-muted);color:var(--text);font: .75rem/1.7 ui-monospace,Consolas,monospace;white-space:pre-wrap}
        button{display:inline-flex;min-height:42px;align-items:center;gap:.5rem;margin-top:12px;padding:.6rem .85rem;border:1px solid transparent;border-radius:9px;background:var(--accent);color:var(--accent-ink);cursor:pointer;font-family:inherit;font-size:.75rem;font-weight:700;line-height:1;transition:background-color 150ms ease,transform 150ms ease}
        button:hover{background:var(--accent-strong);transform:translateY(-1px)}
        button[aria-pressed="true"]{border-color:var(--line);background:var(--surface);color:var(--text)}
        button:focus-visible{outline:3px solid var(--accent-strong);outline-offset:3px}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{transition-duration:.01ms!important}}
      </style>
      <p>Select a page element to inspect its tag, classes, and text. Your first click is captured instead of activated.</p>
      <div id="out" role="status" aria-live="polite">No element selected.</div>
      <button id="toggle" type="button" aria-pressed="false"><span aria-hidden="true">◎</span> Start inspecting</button>
    `;
  }

  onToggle() {
    this.setActive(!this.active);
  }

  setActive(active) {
    if (this.active === active) return;
    this.active = active;
    const button = this.shadowRoot.getElementById('toggle');
    if (button) {
      button.textContent = active ? 'Stop inspecting' : '◎ Start inspecting';
      button.setAttribute('aria-pressed', String(active));
    }

    if (active) {
      this.originalCursor = document.body.style.cursor;
      document.body.style.cursor = 'crosshair';
      document.addEventListener('click', this.onDocumentClick, true);
    } else {
      document.body.style.cursor = this.originalCursor;
      document.removeEventListener('click', this.onDocumentClick, true);
    }
  }

  onDocumentClick(event) {
    const path = event.composedPath();
    if (path.includes(this)) return;

    const target = event.composedPath()[0] || event.target;
    if (!(target instanceof Element)) return;

    event.preventDefault();
    event.stopPropagation();
    this.clearHighlight();
    this.highlightedElement = target;
    target.classList.add('highlight');
    this.highlightTimer = window.setTimeout(() => this.clearHighlight(), 1200);

    const className = target.getAttribute('class') || '-';
    const text = (target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120) || '-';
    this.shadowRoot.getElementById('out').textContent = `tag: ${target.tagName.toLowerCase()}\nclasses: ${className}\ntext: ${text}`;
  }

  clearHighlight() {
    if (this.highlightTimer !== null) window.clearTimeout(this.highlightTimer);
    this.highlightTimer = null;
    this.highlightedElement?.classList.remove('highlight');
    this.highlightedElement = null;
  }
}

if (!customElements.get('demo-tabs')) customElements.define('demo-tabs', DemoTabs);
if (!customElements.get('drag-list')) customElements.define('drag-list', DragList);
if (!customElements.get('todo-app')) customElements.define('todo-app', TodoApp);
if (!customElements.get('dom-inspector')) customElements.define('dom-inspector', DomInspector);

function initializePage() {
  const tabButtons = [...document.querySelectorAll('.tabs [role="tab"][data-target]')];
  const panels = [...document.querySelectorAll('main [role="tabpanel"]')];

  function activateTab(button, moveFocus = false) {
    const panel = document.getElementById(button.dataset.target);
    if (!panel || !panels.includes(panel)) return;

    tabButtons.forEach((tab) => {
      const selected = tab === button;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.classList.toggle('is-active', selected);
    });
    panels.forEach((item) => {
      const active = item === panel;
      item.hidden = !active;
      item.setAttribute('aria-hidden', String(!active));
    });
    if (moveFocus) button.focus();
  }

  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => activateTab(button));
    button.addEventListener('keydown', (event) => {
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabButtons.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabButtons.length - 1;
      else return;

      event.preventDefault();
      activateTab(tabButtons[nextIndex], true);
    });
  });

  const themeButton = document.getElementById('theme-toggle');
  const body = document.body;

  async function setTheme(dark, skipSync = false) {
    body.classList.toggle('dark', dark);
    themeButton?.setAttribute('aria-pressed', String(dark));
    const label = themeButton?.querySelector('.theme-label');
    if (label) label.textContent = dark ? 'Light mode' : 'Dark mode';
    localStorage.setItem('ui-dark', dark ? '1' : '0');
    
    if (getCurrentUser() && !skipSync) {
      try {
        await api.preferences.updateTheme(dark ? '1' : '0');
      } catch (err) {
        console.error('Failed to sync theme', err);
      }
    }
  }

  setTheme(localStorage.getItem('ui-dark') === '1', true);
  themeButton?.addEventListener('click', () => setTheme(!body.classList.contains('dark')));
  
  document.addEventListener('auth:login', async () => {
    try {
      const prefs = await api.preferences.get();
      if (prefs && prefs.theme) {
        setTheme(prefs.theme === '1', true);
      } else {
        await api.preferences.updateTheme(body.classList.contains('dark') ? '1' : '0');
      }
    } catch (err) {
      console.error('Failed to get preferences', err);
    }
  });

  const modal = document.getElementById('modal');
  const openModalButton = document.getElementById('open-modal');
  let returnFocusTo = null;

  function getModalControls() {
    return [...(modal?.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') || [])]
      .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
  }

  function closeModal(restoreFocus = true) {
    if (!modal) return;
    modal.hidden = true;
    if (restoreFocus) returnFocusTo?.focus();
  }

  openModalButton?.addEventListener('click', () => {
    if (!modal) return;
    returnFocusTo = document.activeElement;
    modal.hidden = false;
    (getModalControls()[0] || modal).focus();
  });

  modal?.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest?.('[data-close-modal]')) closeModal();
  });

  modal?.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = getModalControls();
    if (controls.length === 0) {
      event.preventDefault();
      modal.focus();
      return;
    }

    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === modal)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal && !modal.hidden) {
      closeModal();
      return;
    }

    const target = event.composedPath()[0] || event.target;
    const typing = target instanceof HTMLElement
      && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    if (
      event.key.toLowerCase() === 'g'
      && !event.altKey
      && !event.ctrlKey
      && !event.metaKey
      && !event.shiftKey
      && !typing
    ) {
      const header = document.querySelector('.site-header');
      if (!header) return;
      header.classList.remove('highlight');
      void header.offsetWidth;
      header.classList.add('highlight');
      window.setTimeout(() => header.classList.remove('highlight'), 900);
    }
  });
  
  initAuthUI();
  checkSession();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage, { once: true });
} else {
  initializePage();
}

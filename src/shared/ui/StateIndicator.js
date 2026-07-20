/**
 * SIAKAD-X State Indicator Component
 * Encapsulated loading/empty/error/partial/stale states.
 */

const STATE_STYLES = {
  loading: { icon: 'spinner', class: 'siakadx-state--loading' },
  error: { icon: 'error', class: 'siakadx-state--error' },
  empty: { icon: 'info', class: 'siakadx-state--empty' },
  partial: { icon: 'warn', class: 'siakadx-state--partial' },
  stale: { icon: 'info', class: 'siakadx-state--stale' },
  unsupported: { icon: 'info', class: 'siakadx-state--unsupported' },
};

const ICONS = {
  spinner:
    '<svg class="siakadx-spinner siakadx-spinner--inline" viewBox="0 0 24 24" aria-hidden="true"><circle class="siakadx-spinner__path" cx="12" cy="12" r="10" fill="none" stroke-width="3" stroke-linecap="round"/></svg>',
  error:
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v6M12 16h0.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  info:
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 16v-4M12 8.5h0.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  warn:
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

/**
 * @param {Object} props
 * @param {'loading' | 'empty' | 'error' | 'partial' | 'stale' | 'unsupported'} props.state
 * @param {string} [props.title=''] - Shown in bold
 * @param {string} props.message - Main text
 * @param {string} [props.actionText] - Optional action button text
 * @param {() => void} [props.onAction] - Action handler
 * @returns {HTMLDivElement}
 */
export function StateIndicator({ state, title = '', message, actionText, onAction }) {
  const el = document.createElement('div');
  el.className = ['siakadx-state', STATE_STYLES[state].class].filter(Boolean).join(' ');
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', state === 'loading' ? 'polite' : 'assertive');

  const icon = document.createElement('span');
  icon.className = 'siakadx-state__icon';
  icon.innerHTML = ICONS[STATE_STYLES[state].icon] || '';
  icon.setAttribute('aria-hidden', 'true');
  el.appendChild(icon);

  const content = document.createElement('span');
  content.className = 'siakadx-state__content';
  if (title) {
    const titleEl = document.createElement('strong');
    titleEl.className = 'siakadx-state__title';
    titleEl.textContent = title;
    content.appendChild(titleEl);
    content.appendChild(document.createTextNode('. '));
  }
  const msgEl = document.createElement('span');
  msgEl.textContent = message;
  content.appendChild(msgEl);

  el.appendChild(content);

  if (actionText && onAction) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'siakadx-btn siakadx-btn--sm siakadx-btn--ghost';
    btn.textContent = actionText;
    btn.addEventListener('click', onAction);
    el.appendChild(btn);
  }

  return el;
}

/**
 * @param {string} message Loading text
 * @returns {HTMLDivElement}
 */
export function LoadingState(message = 'Memuat data...') {
  return StateIndicator({ state: 'loading', message });
}

/**
 * @param {string} message Empty text
 * @returns {HTMLDivElement}
 */
export function EmptyState(message = 'Belum ada data.') {
  return StateIndicator({ state: 'empty', message });
}

/**
 * @param {string} message Error text
 * @param {() => void} [onRetry]
 * @returns {HTMLDivElement}
 */
export function ErrorState(message = 'Data tidak dapat dimuat.', onRetry) {
  return StateIndicator({
    state: 'error',
    title: 'Terjadi kesalahan',
    message,
    actionText: onRetry ? 'Coba lagi' : undefined,
    onAction: onRetry,
  });
}
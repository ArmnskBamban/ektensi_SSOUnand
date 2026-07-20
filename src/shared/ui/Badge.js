/**
 * SIAKAD-X UI Badge Component
 * Status label with semantic color.
 */

const BADGE_VARIANTS = {
  default: { class: '' },
  info: { class: 'siakadx-badge--info' },
  success: { class: 'siakadx-badge--success' },
  warning: { class: 'siakadx-badge--warning' },
  danger: { class: 'siakadx-badge--danger' },
  accent: { class: 'siakadx-badge--accent' },
};

/**
 * @param {Object} props
 * @param {string} [props.label] - Text for the badge
 * @param {string} [props.text] - Alias for label
 * @param {'default' | 'info' | 'success' | 'warning' | 'danger' | 'accent'} [props.variant='default']
 * @param {string} [props.className=''] - Additional classes
 * @returns {HTMLSpanElement}
 */
export function Badge({ label, text, variant = 'default', className = '' }) {
  const badge = document.createElement('span');
  badge.className = [
    'siakadx-badge',
    BADGE_VARIANTS[variant]?.class || '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  badge.textContent = label ?? text ?? '';
  return badge;
}

/**
 * Status list item (label + value with level).
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {'ok' | 'warn' | 'error' | 'info'} [props.level='ok']
 * @returns {HTMLLIElement}
 */
export function StatusItem({ label, value, level = 'ok' }) {
  const li = document.createElement('li');
  li.className = `siakadx-status-item siakadx-status-item--${level}`;

  const labelEl = document.createElement('span');
  labelEl.className = 'siakadx-status-item__label';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.className = 'siakadx-status-item__value';
  valueEl.textContent = value;

  li.appendChild(labelEl);
  li.appendChild(valueEl);
  return li;
}

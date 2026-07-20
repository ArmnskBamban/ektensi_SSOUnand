/**
 * SIAKAD-X UI Button Component
 * Accessible, keyboard-navigable button with variant support.
 */

/**
 * @typedef {'primary' | 'secondary' | 'ghost' | 'danger' | 'success'} ButtonVariant
 * @typedef {'sm' | 'md' | 'lg'} ButtonSize
 */

/**
 * @param {Object} props
 * @param {string} props.text - Button text label
 * @param {ButtonVariant} [props.variant='primary'] - Visual variant
 * @param {ButtonSize} [props.size='md'] - Button size
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {boolean} [props.loading=false] - Loading spinner state
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {Object} [props.attrs={}] - Extra HTML attributes
 * @returns {HTMLButtonElement}
 */
export function Button({
  text,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  attrs = {},
}) {
  const btn = document.createElement('button');

  // Base classes
  const baseClasses = [
    'siakadx-btn',
    'siakadx-btn--' + variant,
    'siakadx-btn--' + size,
  ];

  // State classes
  if (disabled || loading) {
    baseClasses.push('siakadx-btn--disabled');
  }

  // Custom classes
  if (className) {
    baseClasses.push(className);
  }

  btn.className = baseClasses.join(' ');
  btn.type = 'button';
  btn.disabled = disabled || loading;
  btn.setAttribute('aria-busy', loading ? 'true' : 'false');
  btn.setAttribute('role', 'button');

  // Icon container for future SVG icons
  const iconContainer = document.createElement('span');
  iconContainer.className = 'siakadx-btn__icon';
  if (loading) {
    iconContainer.innerHTML = `
      <svg class="siakadx-spinner" viewBox="0 0 24 24" aria-hidden="true">
        <circle class="siakadx-spinner__path" cx="12" cy="12" r="10" fill="none" stroke-width="3" stroke-linecap="round"></circle>
      </svg>
    `;
  }

  // Text
  const textNode = document.createElement('span');
  textNode.className = 'siakadx-btn__text';
  textNode.textContent = text;

  btn.appendChild(iconContainer);
  btn.appendChild(textNode);

  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'onclick') {
      btn.addEventListener('click', value);
    } else {
      btn.setAttribute(key, value);
    }
  });

  return btn;
}

/**
 * @param {Object} props
 * @param {string} props.text - Button text
 * @param {Object} [props.attrs={}]
 * @returns {HTMLButtonElement}
 */
export function PrimaryButton(props) {
  return Button({ ...props, variant: 'primary' });
}

/**
 * @param {Object} props
 * @param {string} props.text - Button text
 * @param {Object} [props.attrs={}]
 * @returns {HTMLButtonElement}
 */
export function SecondaryButton(props) {
  return Button({ ...props, variant: 'secondary' });
}

/**
 * @param {Object} props
 * @param {string} props.text - Button text
 * @param {Object} [props.attrs={}]
 * @returns {HTMLButtonElement}
 */
export function GhostButton(props) {
  return Button({ ...props, variant: 'ghost' });
}

/**
 * @param {Object} props
 * @param {string} props.text - Button text
 * @param {Object} [props.attrs={}]
 * @returns {HTMLButtonElement}
 */
export function DangerButton(props) {
  return Button({ ...props, variant: 'danger' });
}
/**
 * SIAKAD-X UI Card Component
 * Consistent card container with header and footer.
 */

/**
 * @param {Object} props
 * @param {string} [props.title=''] - Card title text
 * @param {string} [props.subtitle=''] - Card subtitle text
 * @param {HTMLElement | string | null} [props.content=null] - Main content element or HTML string
 * @param {HTMLElement | string | null} [props.footer=null] - Footer content element or HTML string
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {Object} [props.attrs={}] - Extra HTML attributes
 * @returns {HTMLDivElement}
 */
export function Card({
  title = '',
  subtitle = '',
  content = null,
  footer = null,
  className = '',
  attrs = {},
}) {
  const card = document.createElement('div');

  card.className = ['siakadx-card', className].filter(Boolean).join(' ');
  card.setAttribute('data-siakadx-root', 'card');

  // Header
  if (title || subtitle) {
    const header = document.createElement('div');
    header.className = 'siakadx-card__header';

    if (title) {
      const titleEl = document.createElement('h2');
      titleEl.className = 'siakadx-card__title';
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }

    if (subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.className = 'siakadx-card__subtitle';
      subtitleEl.textContent = subtitle;
      header.appendChild(subtitleEl);
    }

    card.appendChild(header);
  }

  // Body
  if (content !== null) {
    const body = document.createElement('div');
    body.className = 'siakadx-card__body';

    if (typeof content === 'string') {
      body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      body.appendChild(content);
    }

    card.appendChild(body);
  }

  // Footer
  if (footer !== null) {
    const footerEl = document.createElement('div');
    footerEl.className = 'siakadx-card__footer';

    if (typeof footer === 'string') {
      footerEl.innerHTML = footer;
    } else if (footer instanceof HTMLElement) {
      footerEl.appendChild(footer);
    }

    card.appendChild(footerEl);
  }

  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'onclick') {
      card.addEventListener('click', value);
    } else {
      card.setAttribute(key, value);
    }
  });

  return card;
}

/**
 * @param {Object} props
 * @param {string} [props.title] - Card title
 * @param {HTMLElement | string} props.children - Content (can be any HTML or Card)
 * @param {string} [props.className='']
 * @param {Object} [props.attrs={}]
 * @returns {HTMLDivElement}
 */
export function Panel(props) {
  return Card({ ...props, className: 'siakadx-panel ' + (props.className || '') });
}

/**
 * @param {Object} props
 * @param {string} [props.title] - Panel title
 * @param {HTMLElement | string} props.children - Content
 * @param {string} [props.className='']
 * @param {Object} [props.attrs={}]
 * @returns {HTMLDivElement}
 */
export function DashboardCard(props) {
  return Card({ ...props, className: 'siakadx-dashboard-card ' + (props.className || '') });
}
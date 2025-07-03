/**
 * Email Extraction Visualization POC
 *
 * This script loads a sample email and extracted data elements.
 * It highlights extracted spans in the email and links them to a sidebar.
 * Hovering either in the sidebar or on a span highlights both in sync.
 *
 * @author Andy Weaver
 * @date 2025-07-03
 * @version 0.0.1
 * @license MIT
 */

/**
 * Sample email (inline for POC)
 * In practice, could load dynamically.
 */
const emailText = `
Hello Underwriting Team,

Could you please update quote #1234567 to include cyber liability coverage and increase the building limit to $1,000,000?

This is for our client: Acme Corp.

Let me know if you have any questions.

Best,
Agent Smith
`;

/**
 * Extracted data elements (could come from LLM+keyword extraction)
 * For POC, hardcoded with char indices and methods.
 */
const extractedElements = [
  {
    id: 'qnum',
    label: 'Quote Number',
    text: 'quote #1234567',
    extracted_value: '{"quote_numb": "1234567"}',
    start: emailText.indexOf('quote #1234567'),
    end: emailText.indexOf('quote #1234567') + 'quote #1234567'.length,
    method: 'keyword',
    confidence: 0.97,
    category: 'identifiers',
  },
  {
    id: 'covg',
    label: 'Coverage Add',
    text: 'include cyber liability coverage',
    extracted_value: '{"coverage": "cyber liability"}',
    start: emailText.indexOf('include cyber liability coverage'),
    end:
      emailText.indexOf('include cyber liability coverage') +
      'include cyber liability coverage'.length,
    method: 'llm',
    confidence: 0.92,
    category: 'new_coverage',
  },
  {
    id: 'bldg',
    label: 'Building Limit',
    text: 'increase the building limit to $1,000,000',
    extracted_value: '{"building_limit": 1000000}',
    start: emailText.indexOf('increase the building limit to $1,000,000'),
    end:
      emailText.indexOf('increase the building limit to $1,000,000') +
      'increase the building limit to $1,000,000'.length,
    method: 'llm',
    confidence: 0.91,
    category: 'update_coverage',
  },
  {
    id: 'client',
    label: 'Client Name',
    text: 'Acme Corp.',
    extracted_value: '{"insured_name": "Acme Corp."}',
    start: emailText.indexOf('Acme Corp.'),
    end: emailText.indexOf('Acme Corp.') + 'Acme Corp.'.length,
    method: 'llm',
    confidence: 0.89,
    category: 'identifiers',
  },
  {
    id: 'agent',
    label: 'Agent Name',
    text: 'Agent Smith',
    extracted_value: '{"agent_name": "Agent Smith"}',
    start: emailText.indexOf('Agent Smith'),
    end: emailText.indexOf('Agent Smith') + 'Agent Smith'.length,
    method: 'keyword',
    confidence: 0.99,
    category: 'identifiers',
  },
];

/**
 * Renders extracted elements grouped by category with accordion behavior.
 * @param {Array} elements
 */
function renderExtractedList(elements) {
  const list = document.getElementById('extracted-list');
  list.innerHTML = '';

  // Group by category
  const grouped = {};
  elements.forEach((el) => {
    if (!grouped[el.category]) grouped[el.category] = [];
    grouped[el.category].push(el);
  });

  // Accordion state (category: expanded/collapsed)
  if (!window.accordionState) {
    window.accordionState = {};
    Object.keys(grouped).forEach((cat) => (window.accordionState[cat] = true));
  }

  Object.entries(grouped).forEach(([category, items]) => {
    // Accordion header
    const section = document.createElement('li');
    section.style.listStyle = 'none';
    section.style.marginBottom = '7px';

    const header = document.createElement('div');
    header.textContent = category
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase());
    header.className = 'accordion-header';
    header.tabIndex = 0;
    header.style.fontWeight = 'bold';
    header.style.padding = '5px 8px';
    header.style.cursor = 'pointer';
    header.style.marginBottom = '2px';
    header.style.background = '#e8eaf6';
    header.style.borderRadius = '5px';
    header.style.fontSize = '1em';
    header.style.display = 'flex';
    header.style.alignItems = 'center';

    // Indicator for open/closed
    const indicator = document.createElement('span');
    indicator.textContent = window.accordionState[category] ? '▼' : '►';
    indicator.style.marginRight = '7px';
    indicator.style.fontSize = '0.9em';
    header.prepend(indicator);

    header.addEventListener('click', () => {
      window.accordionState[category] = !window.accordionState[category];
      renderExtractedList(elements); // re-render
    });
    header.addEventListener('keypress', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        window.accordionState[category] = !window.accordionState[category];
        renderExtractedList(elements);
      }
    });

    section.appendChild(header);

    // Section body
    const ul = document.createElement('ul');
    ul.style.padding = '0 0 0 10px';
    ul.style.margin = 0;
    ul.style.display = window.accordionState[category] ? 'block' : 'none';

    items.forEach((el) => {
      const li = document.createElement('li');
      li.className = 'outline-item';
      li.dataset.id = el.id;
      li.dataset.method = el.method;
      li.tabIndex = 0;
      li.innerHTML = `
        <strong>${el.label}:</strong> ${el.extracted_value || el.text} <br>
        <span class="confidence">${(el.confidence * 100).toFixed(0)}%</span>
      `;
      li.addEventListener('mouseenter', () => setActive(el.id));
      li.addEventListener('mouseleave', () => clearActive());
      li.addEventListener('focus', () => setActive(el.id));
      li.addEventListener('blur', () => clearActive());
      ul.appendChild(li);
    });
    section.appendChild(ul);

    list.appendChild(section);
  });
}

/**
 * Renders the email, wrapping extracted spans with highlighting.
 * @param {string} text
 * @param {Array} elements
 */
function renderEmailContent(text, elements) {
  const container = document.getElementById('email-content');
  // Sort by start index, to avoid overlapping tags
  const sorted = [...elements].sort((a, b) => a.start - b.start);
  let result = '';
  let cursor = 0;
  sorted.forEach((el) => {
    // Add text before extracted span
    if (el.start > cursor) {
      result += escapeHtml(text.slice(cursor, el.start));
    }
    // Add highlighted extracted span
    const spanHtml = `<span class="extracted" data-id="${el.id}" data-method="${
      el.method
    }" tabindex="0">${escapeHtml(el.text)}</span>`;
    result += spanHtml;
    cursor = el.end;
  });
  // Add remainder
  if (cursor < text.length) {
    result += escapeHtml(text.slice(cursor));
  }
  container.innerHTML = result;

  // Add event listeners for highlighting sync
  container.querySelectorAll('.extracted').forEach((span) => {
    const id = span.dataset.id;
    span.addEventListener('mouseenter', () => setActive(id));
    span.addEventListener('mouseleave', clearActive);
    span.addEventListener('focus', () => setActive(id));
    span.addEventListener('blur', clearActive);
  });
}

/**
 * Escapes HTML for safe rendering.
 * @param {string} str
 */
function escapeHtml(str) {
  return str.replace(
    /[&<>"']/g,
    (ch) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[ch]),
  );
}

/**
 * Sets the active highlight for a given id.
 * @param {string} id
 */
function setActive(id) {
  document.querySelectorAll('.outline-item, .extracted').forEach((el) => {
    if (el.dataset.id === id) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

/**
 * Clears any highlight.
 */
function clearActive() {
  document.querySelectorAll('.outline-item, .extracted').forEach((el) => {
    el.classList.remove('active');
  });
}

// --- Initialization ---

renderExtractedList(extractedElements);
renderEmailContent(emailText, extractedElements);

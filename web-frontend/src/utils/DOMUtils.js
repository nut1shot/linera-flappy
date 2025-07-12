/**
 * DOM Utilities - Centralized DOM manipulation functions
 * 
 * This module provides reusable DOM manipulation methods to reduce
 * code duplication and provide consistent DOM handling patterns.
 */

export class DOMUtils {
  /**
   * Toggle element visibility
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {boolean} show - Whether to show or hide the element
   * @param {string} displayType - Display type when showing ('block', 'flex', etc.)
   */
  static toggleElement(element, show, displayType = 'block') {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
      el.style.display = show ? displayType : 'none';
    }
  }

  /**
   * Show element with specified display type
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {string} displayType - Display type ('block', 'flex', 'inline', etc.)
   */
  static showElement(element, displayType = 'block') {
    this.toggleElement(element, true, displayType);
  }

  /**
   * Hide element
   * @param {string|HTMLElement} element - Element ID or element reference
   */
  static hideElement(element) {
    this.toggleElement(element, false);
  }

  /**
   * Add CSS class to element
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {string} className - CSS class name to add
   */
  static addClass(element, className) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el && className) {
      el.classList.add(className);
    }
  }

  /**
   * Remove CSS class from element
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {string} className - CSS class name to remove
   */
  static removeClass(element, className) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el && className) {
      el.classList.remove(className);
    }
  }

  /**
   * Toggle CSS class on element
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {string} className - CSS class name to toggle
   * @param {boolean} force - Force add (true) or remove (false), undefined for toggle
   */
  static toggleClass(element, className, force) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el && className) {
      if (force !== undefined) {
        el.classList.toggle(className, force);
      } else {
        el.classList.toggle(className);
      }
    }
  }

  /**
   * Set text content of element
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {string} text - Text content to set
   */
  static setText(element, text) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
      el.textContent = text;
    }
  }

  /**
   * Set HTML content of element
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {string} html - HTML content to set
   */
  static setHTML(element, html) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
      el.innerHTML = html;
    }
  }

  /**
   * Get element value (for inputs)
   * @param {string|HTMLElement} element - Element ID or element reference
   * @returns {string} Element value
   */
  static getValue(element) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    return el ? el.value : '';
  }

  /**
   * Set element value (for inputs)
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {string} value - Value to set
   */
  static setValue(element, value) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
      el.value = value;
    }
  }

  /**
   * Clear element value (for inputs)
   * @param {string|HTMLElement} element - Element ID or element reference
   */
  static clearValue(element) {
    this.setValue(element, '');
  }

  /**
   * Enable or disable element
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {boolean} enabled - Whether element should be enabled
   */
  static setEnabled(element, enabled) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
      el.disabled = !enabled;
    }
  }

  /**
   * Set element attribute
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {string} attribute - Attribute name
   * @param {string} value - Attribute value
   */
  static setAttribute(element, attribute, value) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
      el.setAttribute(attribute, value);
    }
  }

  /**
   * Remove element attribute
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {string} attribute - Attribute name to remove
   */
  static removeAttribute(element, attribute) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
      el.removeAttribute(attribute);
    }
  }

  /**
   * Check if element exists
   * @param {string} elementId - Element ID to check
   * @returns {boolean} True if element exists
   */
  static exists(elementId) {
    return document.getElementById(elementId) !== null;
  }

  /**
   * Add event listener to element
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {string} event - Event type
   * @param {Function} handler - Event handler function
   * @param {object} options - Event listener options
   */
  static addEventListener(element, event, handler, options = {}) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el && handler) {
      el.addEventListener(event, handler, options);
    }
  }

  /**
   * Remove event listener from element
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {string} event - Event type
   * @param {Function} handler - Event handler function
   */
  static removeEventListener(element, event, handler) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el && handler) {
      el.removeEventListener(event, handler);
    }
  }

  /**
   * Query element by selector
   * @param {string} selector - CSS selector
   * @param {HTMLElement} parent - Parent element to search within (default: document)
   * @returns {HTMLElement|null} Found element or null
   */
  static query(selector, parent = document) {
    return parent.querySelector(selector);
  }

  /**
   * Query all elements by selector
   * @param {string} selector - CSS selector
   * @param {HTMLElement} parent - Parent element to search within (default: document)
   * @returns {NodeList} Found elements
   */
  static queryAll(selector, parent = document) {
    return parent.querySelectorAll(selector);
  }

  /**
   * Focus element
   * @param {string|HTMLElement} element - Element ID or element reference
   */
  static focus(element) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el && el.focus) {
      el.focus();
    }
  }

  /**
   * Scroll element into view
   * @param {string|HTMLElement} element - Element ID or element reference
   * @param {object} options - Scroll options
   */
  static scrollIntoView(element, options = { behavior: 'smooth' }) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el && el.scrollIntoView) {
      el.scrollIntoView(options);
    }
  }

  /**
   * Get element dimensions and position
   * @param {string|HTMLElement} element - Element ID or element reference
   * @returns {object} Element bounds (x, y, width, height, etc.)
   */
  static getBounds(element) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    return el ? el.getBoundingClientRect() : null;
  }

  /**
   * Check if device is mobile
   * @returns {boolean} True if mobile device
   */
  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  }

  /**
   * Get viewport dimensions
   * @returns {object} Viewport width and height
   */
  static getViewport() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  /**
   * Create element with attributes and content
   * @param {string} tagName - HTML tag name
   * @param {object} attributes - Element attributes
   * @param {string} content - Element content
   * @returns {HTMLElement} Created element
   */
  static createElement(tagName, attributes = {}, content = '') {
    const element = document.createElement(tagName);
    
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'textContent') {
        element.textContent = attributes[key];
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });
    
    if (content) {
      element.innerHTML = content;
    }
    
    return element;
  }
}
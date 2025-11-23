// Backend validation utility functions

const validators = {
  // Email validation
  email: (value, required = true) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: 'Email is required' };
    if (typeof value !== 'string' || value.length > 255) {
      return { valid: false, message: 'Email must be a string with 255 characters or less' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }
    return { valid: true };
  },

  // Password validation
  password: (value, required = true) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: 'Password is required' };
    if (typeof value !== 'string') {
      return { valid: false, message: 'Password must be a string' };
    }
    if (value.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters' };
    }
    if (value.length > 255) {
      return { valid: false, message: 'Password must be 255 characters or less' };
    }
    return { valid: true };
  },

  // Name validation
  name: (value, required = true, fieldName = 'Name', maxLength = 255) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: `${fieldName} is required` };
    if (typeof value !== 'string') {
      return { valid: false, message: `${fieldName} must be a string` };
    }
    if (value.trim().length === 0) {
      return { valid: false, message: `${fieldName} cannot be empty` };
    }
    if (value.length > maxLength) {
      return { valid: false, message: `${fieldName} must be ${maxLength} characters or less` };
    }
    if (value.trim().length < 2) {
      return { valid: false, message: `${fieldName} must be at least 2 characters` };
    }
    return { valid: true };
  },

  // Phone validation
  phone: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (value && typeof value !== 'string') {
      return { valid: false, message: 'Phone must be a string' };
    }
    if (value && value.length > 50) {
      return { valid: false, message: 'Phone number must be 50 characters or less' };
    }
    if (value) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(value)) {
        return { valid: false, message: 'Please enter a valid phone number' };
      }
    }
    return { valid: true };
  },

  // URL validation
  url: (value, required = false, maxLength = 255) => {
    if (!value && !required) return { valid: true };
    if (value && typeof value !== 'string') {
      return { valid: false, message: 'URL must be a string' };
    }
    if (value && value.length > maxLength) {
      return { valid: false, message: `URL must be ${maxLength} characters or less` };
    }
    if (value) {
      try {
        new URL(value.startsWith('http') ? value : `https://${value}`);
      } catch {
        return { valid: false, message: 'Please enter a valid URL' };
      }
    }
    return { valid: true };
  },

  // Text validation
  text: (value, required = false, fieldName = 'Text', maxLength = 65535) => {
    if (!value && !required) return { valid: true };
    if (value && typeof value !== 'string') {
      return { valid: false, message: `${fieldName} must be a string` };
    }
    if (value && value.length > maxLength) {
      return { valid: false, message: `${fieldName} must be ${maxLength} characters or less` };
    }
    return { valid: true };
  },

  // Number validation
  number: (value, required = false, fieldName = 'Number', min = null, max = null) => {
    if (value === null || value === undefined) {
      if (required) return { valid: false, message: `${fieldName} is required` };
      return { valid: true };
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
      return { valid: false, message: `${fieldName} must be a valid number` };
    }
    if (min !== null && num < min) {
      return { valid: false, message: `${fieldName} must be at least ${min}` };
    }
    if (max !== null && num > max) {
      return { valid: false, message: `${fieldName} must be at most ${max}` };
    }
    return { valid: true };
  },

  // Integer validation
  integer: (value, required = false, fieldName = 'Number', min = null, max = null) => {
    if (value === null || value === undefined) {
      if (required) return { valid: false, message: `${fieldName} is required` };
      return { valid: true };
    }
    const num = parseInt(value, 10);
    if (isNaN(num) || !Number.isInteger(parseFloat(value))) {
      return { valid: false, message: `${fieldName} must be a valid integer` };
    }
    if (min !== null && num < min) {
      return { valid: false, message: `${fieldName} must be at least ${min}` };
    }
    if (max !== null && num > max) {
      return { valid: false, message: `${fieldName} must be at most ${max}` };
    }
    return { valid: true };
  },

  // Date validation
  date: (value, required = false, fieldName = 'Date') => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: `${fieldName} is required` };
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, message: `${fieldName} must be a valid date` };
    }
    return { valid: true };
  },

  // Currency validation
  currency: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: 'Currency is required' };
    if (typeof value !== 'string') {
      return { valid: false, message: 'Currency must be a string' };
    }
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
    if (!validCurrencies.includes(value.toUpperCase())) {
      return { valid: false, message: 'Please select a valid currency' };
    }
    return { valid: true };
  },

  // Probability validation
  probability: (value, required = false) => {
    return validators.integer(value, required, 'Probability', 0, 100);
  },

  // Deal value validation
  dealValue: (value, required = false) => {
    return validators.number(value, required, 'Deal value', 0, 999999999999999.99);
  },

  // Color validation (hex color)
  color: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (typeof value !== 'string') {
      return { valid: false, message: 'Color must be a string' };
    }
    if (value.length > 50) {
      return { valid: false, message: 'Color must be 50 characters or less' };
    }
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
      return { valid: false, message: 'Please enter a valid hex color (e.g., #FF5733)' };
    }
    return { valid: true };
  },

  // Jira project key validation
  jiraProjectKey: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (typeof value !== 'string') {
      return { valid: false, message: 'Jira project key must be a string' };
    }
    if (value.length > 50) {
      return { valid: false, message: 'Jira project key must be 50 characters or less' };
    }
    if (!/^[A-Z][A-Z0-9]*$/.test(value)) {
      return { valid: false, message: 'Jira project key must be uppercase letters and numbers only' };
    }
    return { valid: true };
  },

  // Jira ticket ID validation
  jiraTicketId: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (typeof value !== 'string') {
      return { valid: false, message: 'Jira ticket ID must be a string' };
    }
    if (value.length > 50) {
      return { valid: false, message: 'Jira ticket ID must be 50 characters or less' };
    }
    return { valid: true };
  },

  // Jira URL validation
  jiraUrl: (value, required = false) => {
    return validators.url(value, required, 500);
  }
};

// Validate request body
const validateRequest = (req, res, rules) => {
  const errors = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(rules)) {
    const value = req.body[field];
    const result = validator(value);

    if (!result.valid) {
      errors[field] = result.message;
      isValid = false;
    }
  }

  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  return null; // Validation passed
};

module.exports = {
  validators,
  validateRequest
};


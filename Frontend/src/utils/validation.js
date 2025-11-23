// Validation utility functions

export const validators = {
  // Email validation
  email: (value, required = true) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: 'Email is required' };
    if (value.length > 255) return { valid: false, message: 'Email must be 255 characters or less' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return { valid: false, message: 'Please enter a valid email address' };
    return { valid: true };
  },

  // Password validation
  password: (value, required = true) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: 'Password is required' };
    if (value.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
    if (value.length > 255) return { valid: false, message: 'Password must be 255 characters or less' };
    return { valid: true };
  },

  // Name validation (full name, first name, last name, organization name)
  name: (value, required = true, fieldName = 'Name', maxLength = 255) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: `${fieldName} is required` };
    if (value.trim().length === 0) return { valid: false, message: `${fieldName} cannot be empty` };
    if (value.length > maxLength) return { valid: false, message: `${fieldName} must be ${maxLength} characters or less` };
    if (value.trim().length < 2) return { valid: false, message: `${fieldName} must be at least 2 characters` };
    return { valid: true };
  },

  // Phone validation
  phone: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: 'Phone number is required' };
    if (value.length > 50) return { valid: false, message: 'Phone number must be 50 characters or less' };
    // Allow various phone formats
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (value && !phoneRegex.test(value)) return { valid: false, message: 'Please enter a valid phone number' };
    return { valid: true };
  },

  // URL validation
  url: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: 'URL is required' };
    if (value.length > 255) return { valid: false, message: 'URL must be 255 characters or less' };
    try {
      new URL(value.startsWith('http') ? value : `https://${value}`);
      return { valid: true };
    } catch {
      return { valid: false, message: 'Please enter a valid URL' };
    }
  },

  // Text validation (for descriptions, notes, etc.)
  text: (value, required = false, fieldName = 'Text', maxLength = 65535) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: `${fieldName} is required` };
    if (value.length > maxLength) return { valid: false, message: `${fieldName} must be ${maxLength} characters or less` };
    return { valid: true };
  },

  // Number validation
  number: (value, required = false, fieldName = 'Number', min = null, max = null) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: `${fieldName} is required` };
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, message: `${fieldName} must be a valid number` };
    if (min !== null && num < min) return { valid: false, message: `${fieldName} must be at least ${min}` };
    if (max !== null && num > max) return { valid: false, message: `${fieldName} must be at most ${max}` };
    return { valid: true };
  },

  // Integer validation
  integer: (value, required = false, fieldName = 'Number', min = null, max = null) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: `${fieldName} is required` };
    const num = parseInt(value, 10);
    if (isNaN(num) || !Number.isInteger(parseFloat(value))) return { valid: false, message: `${fieldName} must be a valid integer` };
    if (min !== null && num < min) return { valid: false, message: `${fieldName} must be at least ${min}` };
    if (max !== null && num > max) return { valid: false, message: `${fieldName} must be at most ${max}` };
    return { valid: true };
  },

  // Date validation
  date: (value, required = false, fieldName = 'Date') => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: `${fieldName} is required` };
    const date = new Date(value);
    if (isNaN(date.getTime())) return { valid: false, message: `${fieldName} must be a valid date` };
    return { valid: true };
  },

  // Currency validation
  currency: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (!value && required) return { valid: false, message: 'Currency is required' };
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
    if (!validCurrencies.includes(value.toUpperCase())) {
      return { valid: false, message: 'Please select a valid currency' };
    }
    return { valid: true };
  },

  // Job title validation
  jobTitle: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (value.length > 255) return { valid: false, message: 'Job title must be 255 characters or less' };
    return { valid: true };
  },

  // Website validation
  website: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (value.length > 255) return { valid: false, message: 'Website URL must be 255 characters or less' };
    return validators.url(value, required);
  },

  // Deal title validation
  dealTitle: (value, required = true) => {
    return validators.name(value, required, 'Deal title', 255);
  },

  // Deal value validation
  dealValue: (value, required = false) => {
    if (!value && !required) return { valid: true };
    return validators.number(value, required, 'Deal value', 0, 999999999999999.99);
  },

  // Probability validation
  probability: (value, required = false) => {
    return validators.integer(value, required, 'Probability', 0, 100);
  },

  // Issue title validation
  issueTitle: (value, required = true) => {
    return validators.name(value, required, 'Issue title', 255);
  },

  // Jira project key validation
  jiraProjectKey: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (value.length > 50) return { valid: false, message: 'Jira project key must be 50 characters or less' };
    if (!/^[A-Z][A-Z0-9]*$/.test(value)) return { valid: false, message: 'Jira project key must be uppercase letters and numbers only' };
    return { valid: true };
  },

  // Jira ticket ID validation
  jiraTicketId: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (value.length > 50) return { valid: false, message: 'Jira ticket ID must be 50 characters or less' };
    return { valid: true };
  },

  // Jira URL validation
  jiraUrl: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (value.length > 500) return { valid: false, message: 'Jira URL must be 500 characters or less' };
    return validators.url(value, required);
  },

  // Stage name validation
  stageName: (value, required = true) => {
    return validators.name(value, required, 'Stage name', 100);
  },

  // Color validation (hex color)
  color: (value, required = false) => {
    if (!value && !required) return { valid: true };
    if (value.length > 50) return { valid: false, message: 'Color must be 50 characters or less' };
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) return { valid: false, message: 'Please enter a valid hex color (e.g., #FF5733)' };
    return { valid: true };
  }
};

// Validate form data object
export const validateForm = (formData, rules) => {
  const errors = {};
  let isValid = true;

  for (const [field, rule] of Object.entries(rules)) {
    const value = formData[field];
    const result = rule(value);

    if (!result.valid) {
      errors[field] = result.message;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// Validate single field
export const validateField = (fieldName, value, validator) => {
  return validator(value);
};


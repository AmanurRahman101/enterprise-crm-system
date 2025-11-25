const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-() ]{7,20}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const CURRENCY_REGEX = /^[A-Z]{3}$/;
const JIRA_PROJECT_REGEX = /^[A-Z][A-Z0-9_-]{1,9}$/;
const JIRA_TICKET_REGEX = /^[A-Z]+-\d+$/;

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isPositiveInteger(value) {
  if (value === null || value === undefined || value === '') {
    return true;
  }
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

function isValidDate(value) {
  if (!value) return true;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function validateSignupInput(payload = {}) {
  const errors = {};
  const email = sanitizeString(payload.email);
  const fullName = sanitizeString(payload.fullName);
  const password = sanitizeString(payload.password);
  const phone = sanitizeString(payload.phone);

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!fullName || fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  if (!password || !PASSWORD_REGEX.test(password)) {
    errors.password =
      'Password must be at least 8 characters and include uppercase, lowercase, and a number.';
  }

  if (phone && !PHONE_REGEX.test(phone)) {
    errors.phone = 'Enter a valid phone number.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function validateSigninInput(payload = {}) {
  const errors = {};
  const email = sanitizeString(payload.email);
  const password = sanitizeString(payload.password);

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function validateDealPayload(payload = {}, options = {}) {
  const { partial = false } = options;
  const errors = {};

  if (!partial || payload.title !== undefined) {
    const title = sanitizeString(payload.title);
    if (!title) {
      errors.title = 'Title is required.';
    } else if (title.length < 3 || title.length > 150) {
      errors.title = 'Title must be between 3 and 150 characters.';
    }
  }

  if (payload.value !== undefined && payload.value !== null && payload.value !== '') {
    const value = Number(payload.value);
    if (Number.isNaN(value) || value < 0) {
      errors.value = 'Value must be a positive number.';
    }
  }

  if (payload.currency !== undefined) {
    const currency = sanitizeString(payload.currency).toUpperCase();
    if (currency && !CURRENCY_REGEX.test(currency)) {
      errors.currency = 'Currency must be a 3-letter ISO code.';
    }
  }

  if (!partial || payload.stageId !== undefined) {
    if (!isPositiveInteger(payload.stageId)) {
      errors.stageId = 'Stage is required.';
    }
  }

  if (payload.contactPersonId !== undefined && !isPositiveInteger(payload.contactPersonId)) {
    errors.contactPersonId = 'Contact person must be a valid contact.';
  }

  if (payload.contactOrgId !== undefined && !isPositiveInteger(payload.contactOrgId)) {
    errors.contactOrgId = 'Contact organization must be a valid contact.';
  }

  if (payload.assignedToUserId !== undefined && !isPositiveInteger(payload.assignedToUserId)) {
    errors.assignedToUserId = 'Assigned user must be valid.';
  }

  if (payload.expectedCloseDate !== undefined && !isValidDate(payload.expectedCloseDate)) {
    errors.expectedCloseDate = 'Enter a valid date.';
  }

  if (payload.probability !== undefined && payload.probability !== null && payload.probability !== '') {
    const probability = Number(payload.probability);
    if (Number.isNaN(probability) || probability < 0 || probability > 100) {
      errors.probability = 'Probability must be between 0 and 100.';
    }
  }

  if (payload.notes !== undefined) {
    const notes = sanitizeString(payload.notes);
    if (notes.length > 2000) {
      errors.notes = 'Notes cannot exceed 2000 characters.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function validateIssuePayload(payload = {}, options = {}) {
  const { partial = false } = options;
  const errors = {};
  const allowedStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  const allowedPriorities = ['low', 'medium', 'high', 'critical'];

  if (!partial || payload.title !== undefined) {
    const title = sanitizeString(payload.title);
    if (!title) {
      errors.title = 'Title is required.';
    } else if (title.length < 3 || title.length > 200) {
      errors.title = 'Title must be between 3 and 200 characters.';
    }
  }

  if (payload.description !== undefined) {
    const description = sanitizeString(payload.description);
    if (description.length > 5000) {
      errors.description = 'Description cannot exceed 5000 characters.';
    }
  }

  if (payload.status !== undefined && !allowedStatuses.includes(payload.status)) {
    errors.status = 'Status is invalid.';
  }

  if (payload.priority !== undefined && !allowedPriorities.includes(payload.priority)) {
    errors.priority = 'Priority is invalid.';
  }

  if (payload.assignedToUserId !== undefined && !isPositiveInteger(payload.assignedToUserId)) {
    errors.assignedToUserId = 'Assigned user must be valid.';
  }

  if (payload.dealId !== undefined && !isPositiveInteger(payload.dealId)) {
    errors.dealId = 'Deal must be valid.';
  }

  if (payload.jira_project_key !== undefined) {
    const key = sanitizeString(payload.jira_project_key);
    if (key && !JIRA_PROJECT_REGEX.test(key)) {
      errors.jira_project_key = 'Jira project key must be 2-10 uppercase letters/numbers.';
    }
  }

  if (payload.jira_ticket_id !== undefined) {
    const ticketId = sanitizeString(payload.jira_ticket_id);
    if (ticketId && !JIRA_TICKET_REGEX.test(ticketId)) {
      errors.jira_ticket_id = 'Jira ticket ID must look like PROJ-123.';
    }
  }

  if (payload.jira_url !== undefined) {
    const url = sanitizeString(payload.jira_url);
    if (url) {
      try {
        new URL(url);
      } catch (e) {
        errors.jira_url = 'Enter a valid URL.';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function validateClientIssuePayload(payload = {}) {
  const { isValid, errors } = validateIssuePayload(payload, { partial: false });
  if (!payload.dealId) {
    errors.dealId = 'Deal selection is required.';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

module.exports = {
  validateSignupInput,
  validateSigninInput,
  validateDealPayload,
  validateIssuePayload,
  validateClientIssuePayload
};



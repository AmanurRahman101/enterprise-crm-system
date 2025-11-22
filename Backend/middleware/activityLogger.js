// Activity Logger Middleware
const db = require('../db/connection');

// Log activity to database
const logActivity = async (organizationId, userId, entityType, entityId, actionType, description, metadata = null) => {
  try {
    await db.query(
      `INSERT INTO activities (organization_id, user_id, entity_type, entity_id, action_type, description, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        organizationId,
        userId,
        entityType,
        entityId,
        actionType,
        description,
        metadata ? JSON.stringify(metadata) : null
      ]
    );
  } catch (error) {
    console.error('Activity logging error:', error);
    // Don't throw - activity logging should not break the main flow
  }
};

// Middleware factory for logging deal changes
const logDealActivity = (actionType) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
      if (data.success && req.user) {
        const dealId = req.params.id || (data.deal && data.deal.id);
        if (dealId) {
          const description = `Deal "${req.body.title || data.deal?.title || 'deal'}" ${actionType}`;
          logActivity(
            req.user.organizationId,
            req.user.userId,
            'deal',
            dealId,
            actionType,
            description,
            { dealId, stageId: req.body.stageId || data.deal?.stage_id }
          );
        }
      }
      return originalJson.call(this, data);
    };
    next();
  };
};

// Middleware factory for logging contact changes
const logContactActivity = (actionType, contactType) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
      if (data.success && req.user) {
        const contactId = req.params.id || (data.contact && data.contact.id);
        if (contactId) {
          const description = `${contactType} ${actionType}`;
          logActivity(
            req.user.organizationId,
            req.user.userId,
            contactType === 'Person' ? 'contact_person' : 'contact_org',
            contactId,
            actionType,
            description,
            { contactId, contactType }
          );
        }
      }
      return originalJson.call(this, data);
    };
    next();
  };
};

// Middleware factory for logging issue changes
const logIssueActivity = (actionType) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
      if (data.success && req.user) {
        const issueId = req.params.id || (data.issue && data.issue.id);
        if (issueId) {
          const description = `Issue "${req.body.title || data.issue?.title || 'issue'}" ${actionType}`;
          logActivity(
            req.user.organizationId,
            req.user.userId,
            'issue',
            issueId,
            actionType,
            description,
            { issueId, status: req.body.status || data.issue?.status }
          );
        }
      }
      return originalJson.call(this, data);
    };
    next();
  };
};

// Log file upload
const logFileUpload = async (req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    if (data.success && req.user && data.file) {
      logActivity(
        req.user.organizationId,
        req.user.userId,
        'file',
        data.file.id,
        'file_uploaded',
        `File "${data.file.originalFilename}" uploaded`,
        { fileId: data.file.id, entityType: req.body.entityType, entityId: req.body.entityId }
      );
    }
    return originalJson.call(this, data);
  };
  next();
};

// Log call activity
const logCallActivity = async (organizationId, userId, contactId, actionType, duration = null) => {
  await logActivity(
    organizationId,
    userId,
    'call',
    contactId,
    actionType,
    `Call ${actionType === 'call_started' ? 'started' : 'ended'}`,
    { contactId, duration }
  );
};

module.exports = {
  logActivity,
  logDealActivity,
  logContactActivity,
  logIssueActivity,
  logFileUpload,
  logCallActivity
};


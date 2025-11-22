// Activity Controller
const db = require('../db/connection');

// Get all activities for current organization
const getActivities = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { entityType, userId, startDate, endDate } = req.query;

    let query = `
      SELECT a.*, u.full_name as user_name, u.email as user_email
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.organization_id = ?
    `;
    const params = [organizationId];

    if (entityType) {
      query += ' AND a.entity_type = ?';
      params.push(entityType);
    }
    if (userId) {
      query += ' AND a.user_id = ?';
      params.push(userId);
    }
    if (startDate) {
      query += ' AND a.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND a.created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY a.created_at DESC LIMIT 500';

    const [activities] = await db.query(query, params);

    res.status(200).json({
      success: true,
      activities: activities.map(activity => {
        // Handle metadata: MySQL JSON columns are automatically parsed by mysql2,
        // but sometimes they might be strings (old data or different DB config)
        let metadata = null;
        if (activity.metadata) {
          if (typeof activity.metadata === 'string') {
            try {
              metadata = JSON.parse(activity.metadata);
            } catch (e) {
              // If parsing fails, treat as null
              metadata = null;
            }
          } else {
            // Already an object, use as-is
            metadata = activity.metadata;
          }
        }

        return {
          id: activity.id,
          userId: activity.user_id,
          userName: activity.user_name,
          userEmail: activity.user_email,
          entityType: activity.entity_type,
          entityId: activity.entity_id,
          actionType: activity.action_type,
          description: activity.description,
          metadata: metadata,
          createdAt: activity.created_at
        };
      })
    });

  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching activities.',
      error: error.message
    });
  }
};

module.exports = {
  getActivities
};


// ============================================
// Call Controller
// Handles voice calling operations
// ============================================

const pool = require('../db/connection');
const agoraConfig = require('../config/agora');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const { hasPermission } = require('../utils/permissions');

// ============================================
// Agora Token Generation
// ============================================

// Generate Agora RTC token for voice channel
const generateAgoraToken = async (req, res) => {
    try {
        const { channelName, uid } = req.body;
        const userId = req.user.userId;
        
        // Allow organization ID from header (for incoming calls) or from JWT
        const organizationId = req.headers['x-organization-id'] || req.user.organizationId || req.user.currentOrganizationId;

        console.log('Generating Agora token for user:', userId, 'organization:', organizationId);

        if (!channelName) {
            return res.status(400).json({ 
                success: false,
                error: 'Channel name is required' 
            });
        }

        if (!organizationId) {
            return res.status(400).json({ 
                success: false,
                error: 'Organization context required to make calls' 
            });
        }

        // Check role-based permission for making/answering calls
        const role = req.user.role;
        if (role && !hasPermission(role, 'MAKE_CALL') && !hasPermission(role, 'ANSWER_CALL')) {
            return res.status(403).json({ 
                success: false,
                error: 'Access denied. Your role does not have permission to make or answer calls.' 
            });
        }

        // Use user ID as Agora UID if not provided
        const agoraUid = uid || userId;

        // Calculate token expiration time
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpireTime = currentTimestamp + agoraConfig.privilegeExpirationTime;

        // Generate RTC token with publisher role (can send and receive audio)
        const token = RtcTokenBuilder.buildTokenWithUid(
            agoraConfig.appId,
            agoraConfig.appCertificate,
            channelName,
            agoraUid,
            RtcRole.PUBLISHER,
            privilegeExpireTime
        );

        res.json({
            success: true,
            token,
            channel: channelName,
            uid: agoraUid,
            appId: agoraConfig.appId
        });

    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to generate token' 
        });
    }
};

// ============================================
// Call Logging
// ============================================

// Start call log
const startCall = async (req, res) => {
    try {
        const { 
            channelName, 
            receiverType,  // 'person' or 'organization'
            receiverContactId, // ID from contacts_people or contacts_organizations
            receiverUserId, // If calling a person linked to a user
            receiverOrganizationId, // If calling an organization
            receiverName // Display name
        } = req.body;
        
        const userId = req.user.userId;
        const organizationId = req.user.organizationId;
        const role = req.user.role;

        // Check permission: viewers cannot make calls
        if (!hasPermission(role, 'MAKE_CALL')) {
            return res.status(403).json({ 
                success: false,
                error: 'Access denied. Your role does not have permission to make calls.' 
            });
        }

        if (!channelName || !receiverType) {
            return res.status(400).json({ 
                success: false,
                error: 'Channel name and receiver type are required' 
            });
        }

        // Insert call log
        const [result] = await pool.query(
            `INSERT INTO call_logs (
                organization_id, 
                caller_user_id, 
                caller_type,
                receiver_type,
                receiver_user_id,
                receiver_organization_id,
                receiver_contact_id,
                receiver_name,
                channel_name, 
                started_at,
                status
            ) VALUES (?, ?, 'person', ?, ?, ?, ?, ?, ?, NOW(), 'calling')`,
            [
                organizationId,
                userId,
                receiverType,
                receiverUserId || null,
                receiverOrganizationId || null,
                receiverContactId || null,
                receiverName || null,
                channelName
            ]
        );

        res.json({
            success: true,
            callLogId: result.insertId,
            message: 'Call started'
        });

    } catch (error) {
        console.error('Start call error:', error);
        console.error('Error details:', error.message);
        console.error('SQL Error:', error.sqlMessage || 'No SQL message');
        res.status(500).json({ 
            success: false,
            error: 'Failed to start call log',
            details: error.message 
        });
    }
};

// End call and update call log with duration
const endCall = async (req, res) => {
    try {
        const { channelName, callLogId, status } = req.body;
        const userId = req.user.userId;
        const organizationId = req.user.organizationId;

        if (!channelName && !callLogId) {
            return res.status(400).json({ 
                success: false,
                error: 'Channel name or call log ID is required' 
            });
        }

        // Determine final status
        const finalStatus = status || 'completed';

        let query, params;
        if (callLogId) {
            // Update by call log ID
            query = `UPDATE call_logs 
                     SET ended_at = NOW(), 
                         duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW()),
                         status = ?
                     WHERE id = ? AND organization_id = ?`;
            params = [finalStatus, callLogId, organizationId];
        } else {
            // Update by channel name (fallback)
            query = `UPDATE call_logs 
                     SET ended_at = NOW(), 
                         duration_seconds = TIMESTAMPDIFF(SECOND, started_at, NOW()),
                         status = ?
                     WHERE caller_user_id = ? 
                       AND organization_id = ?
                       AND channel_name = ? 
                       AND ended_at IS NULL 
                     ORDER BY started_at DESC 
                     LIMIT 1`;
            params = [finalStatus, userId, organizationId, channelName];
        }

        await pool.query(query, params);

        res.json({ 
            success: true,
            message: 'Call ended successfully' 
        });

    } catch (error) {
        console.error('End call error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to end call log' 
        });
    }
};

// ============================================
// Call History
// ============================================

// Get call history for organization
const getCallHistory = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const { limit = 50, offset = 0 } = req.query;

        if (!organizationId) {
            return res.status(400).json({ 
                success: false,
                error: 'User must be part of an organization' 
            });
        }

        const [calls] = await pool.query(
            `SELECT 
                cl.*,
                caller.full_name as caller_name,
                caller.email as caller_email,
                receiver_user.full_name as receiver_user_name,
                receiver_user.email as receiver_user_email,
                receiver_org.name as receiver_org_name
             FROM call_logs cl
             LEFT JOIN users caller ON cl.caller_user_id = caller.id
             LEFT JOIN users receiver_user ON cl.receiver_user_id = receiver_user.id
             LEFT JOIN organizations receiver_org ON cl.receiver_organization_id = receiver_org.id
             WHERE cl.organization_id = ?
             ORDER BY cl.started_at DESC
             LIMIT ? OFFSET ?`,
            [organizationId, parseInt(limit), parseInt(offset)]
        );

        // Format the response
        const formattedCalls = calls.map(call => ({
            id: call.id,
            callerName: call.caller_name,
            callerEmail: call.caller_email,
            receiverType: call.receiver_type,
            receiverName: call.receiver_name || call.receiver_user_name || call.receiver_org_name,
            receiverUserName: call.receiver_user_name,
            receiverOrgName: call.receiver_org_name,
            channelName: call.channel_name,
            startedAt: call.started_at,
            endedAt: call.ended_at,
            durationSeconds: call.duration_seconds,
            status: call.status,
            notes: call.notes
        }));

        res.json({
            success: true,
            calls: formattedCalls,
            total: calls.length
        });

    } catch (error) {
        console.error('Get call history error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch call history' 
        });
    }
};

// Get call statistics for organization
const getCallStatistics = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;

        if (!organizationId) {
            return res.status(400).json({ 
                success: false,
                error: 'User must be part of an organization' 
            });
        }

        // Get total calls, completed, missed, etc.
        const [stats] = await pool.query(
            `SELECT 
                COUNT(*) as total_calls,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_calls,
                SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed_calls,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_calls,
                AVG(duration_seconds) as avg_duration,
                SUM(duration_seconds) as total_duration
             FROM call_logs
             WHERE organization_id = ? AND ended_at IS NOT NULL`,
            [organizationId]
        );

        res.json({
            success: true,
            statistics: stats[0]
        });

    } catch (error) {
        console.error('Get call statistics error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch call statistics' 
        });
    }
};

module.exports = {
    generateAgoraToken,
    startCall,
    endCall,
    getCallHistory,
    getCallStatistics
};


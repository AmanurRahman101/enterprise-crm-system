// ============================================
// WebSocket Call Signaling Module
// Handles real-time call signaling between users
// ============================================

const WebSocket = require('ws');
const db = require('../db/connection');
const { hasPermission } = require('../utils/permissions');

// Store active WebSocket connections: Map<userId, WebSocket>
const activeConnections = new Map();

// ============================================
// Initialize WebSocket Server
// ============================================

function initializeWebSocket(server) {
    const wss = new WebSocket.Server({ 
        server,
        path: '/ws/calls',
        verifyClient: (info) => {
            // Only accept WebSocket connections to /ws/calls path
            return info.req.url.startsWith('/ws/calls');
        }
    });

    wss.on('connection', (ws, req) => {
        console.log('New WebSocket connection for calling from:', req.socket.remoteAddress);
        let userId = null;

        ws.on('message', async (message) => {
            try {
                const data = JSON.parse(message);
                console.log('WebSocket message received:', data.type);

                // Register user WebSocket connection
                if (data.type === 'register') {
                    // Ensure userId is a number for consistent lookup
                    userId = parseInt(data.userId);
                    activeConnections.set(userId, ws);
                    
                    // Update user online status (optional)
                    console.log(`✅ User ${userId} (type: ${typeof userId}) connected for calling. Total active: ${activeConnections.size}`);
                    console.log('Active users:', Array.from(activeConnections.keys()));
                } 
                // Forward outgoing call to target user
                else if (data.type === 'call') {
                    const { targetUserId, channelName, callerName, callerId, organizationId, organizationName, receiverType, receiverOrganizationId, receiverName } = data;
                    
                    // Ensure IDs are numbers for consistent lookup
                    const callerIdNum = parseInt(callerId);
                    
                    // Handle organization-to-organization calls
                    if (receiverType === 'organization' && receiverOrganizationId) {
                        const receiverOrgIdNum = parseInt(receiverOrganizationId);
                        console.log(`📞 Call from user ${callerIdNum} (Organization: ${organizationName || callerName}) to organization ${receiverOrgIdNum}`);
                        
                        // First get the organization name from database
                        db.query('SELECT name FROM organizations WHERE id = ?', [receiverOrgIdNum])
                            .then(([orgs]) => {
                                const receiverOrgName = orgs.length > 0 ? orgs[0].name : receiverOrganizationName || receiverName || `Organization #${receiverOrgIdNum}`;
                                
                                // Then get all members of the target organization with their roles
                                return db.query(
                                    'SELECT uo.user_id, uo.role FROM user_organizations uo WHERE uo.organization_id = ? ORDER BY joined_at ASC',
                                    [receiverOrgIdNum]
                                )
                                    .then(([members]) => {
                                        // Filter out viewers - they cannot answer organization calls
                                        const eligibleMembers = members.filter(member => {
                                            const memberRole = member.role;
                                            // Only include members who can answer calls (not viewers)
                                            return hasPermission(memberRole, 'ANSWER_CALL');
                                        });
                                        
                                        const eligibleUserIds = eligibleMembers.map(row => parseInt(row.user_id));
                                        const allMemberUserIds = members.map(row => parseInt(row.user_id));
                                        
                                        console.log(`Organization ${receiverOrgIdNum} (${receiverOrgName}) has ${allMemberUserIds.length} members (${eligibleUserIds.length} can answer calls):`, eligibleUserIds.map(id => id.toString()));
                                        console.log('Online users:', Array.from(activeConnections.keys()).map(id => id.toString()));
                                        
                                        // Find first online member who can answer calls (exclude viewers)
                                        let targetUserIdNum = null;
                                        for (const memberId of eligibleUserIds) {
                                            const memberWs = activeConnections.get(memberId);
                                            if (memberWs && memberWs.readyState === WebSocket.OPEN) {
                                                targetUserIdNum = memberId;
                                                console.log(`✅ Found online member ${memberId} (can answer calls) in organization ${receiverOrgIdNum}`);
                                                break;
                                            }
                                        }
                                        
                                        if (targetUserIdNum) {
                                            const targetWs = activeConnections.get(targetUserIdNum);
                                            targetWs.send(JSON.stringify({
                                                type: 'incomingCall',
                                                callerId: callerIdNum,
                                                callerName,
                                                channelName,
                                                organizationId, // Caller's organization ID
                                                organizationName, // Caller's organization name
                                                receiverType, // 'person' or 'organization'
                                                receiverOrganizationId: receiverOrgIdNum, // Receiver's organization ID (for org calls)
                                                receiverOrganizationName: receiverOrgName, // Receiver's actual organization name (from database)
                                                receiverName
                                            }));
                                        } else {
                                            console.log(`❌ No online members found in organization ${receiverOrgIdNum}`);
                                            console.log('Organization members:', memberUserIds);
                                            console.log('Online users:', Array.from(activeConnections.keys()));
                                            if (ws.readyState === WebSocket.OPEN) {
                                                ws.send(JSON.stringify({
                                                    type: 'userOffline',
                                                    message: 'No members of this organization are currently online'
                                                }));
                                            }
                                        }
                                    });
                            })
                            .catch((err) => {
                                console.error('Error fetching organization info:', err);
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({
                                        type: 'userOffline',
                                        message: 'Error finding organization members'
                                    }));
                                }
                            });
                    } else {
                        // Handle person-to-person calls (existing logic)
                        const targetUserIdNum = parseInt(targetUserId);
                        
                        if (isNaN(targetUserIdNum)) {
                            console.error('❌ Invalid targetUserId:', targetUserId);
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({
                                    type: 'userOffline',
                                    message: 'Invalid target user ID'
                                }));
                            }
                            return;
                        }
                        
                        console.log(`📞 Call from user ${callerIdNum} (Organization: ${organizationName || callerName}) to user ${targetUserIdNum}`);
                        console.log('Target type:', typeof targetUserIdNum);
                        console.log('Looking for target in:', Array.from(activeConnections.keys()));
                        
                        // Check if target user is online
                        const targetWs = activeConnections.get(targetUserIdNum);
                        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                            console.log(`✅ Target user ${targetUserIdNum} found and online, forwarding call`);
                            targetWs.send(JSON.stringify({
                                type: 'incomingCall',
                                callerId: callerIdNum,
                                callerName,
                                channelName,
                                organizationId, // Caller's organization ID
                                organizationName, // Caller's organization name
                                receiverType, // 'person' or 'organization'
                                receiverOrganizationId: null, // Person calls don't have receiver org
                                receiverName
                            }));
                        } else {
                            console.log(`❌ Target user ${targetUserIdNum} not found or offline`);
                            console.log('Active connections:', Array.from(activeConnections.keys()));
                            // User is offline, send notification back to caller
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({
                                    type: 'userOffline',
                                    message: 'User is currently offline'
                                }));
                            }
                        }
                    }
                } 
                // Notify caller when call is answered
                else if (data.type === 'callAnswered') {
                    const targetUserIdNum = parseInt(data.targetUserId);
                    const targetWs = activeConnections.get(targetUserIdNum);
                    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                        targetWs.send(JSON.stringify({
                            type: 'callAnswered'
                        }));
                    }
                } 
                // Notify caller when call is rejected
                else if (data.type === 'rejectCall') {
                    const targetUserIdNum = parseInt(data.targetUserId);
                    const targetWs = activeConnections.get(targetUserIdNum);
                    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                        targetWs.send(JSON.stringify({
                            type: 'callRejected'
                        }));
                    }
                }
                // Notify when call is ended
                else if (data.type === 'endCall') {
                    const targetUserIdNum = parseInt(data.targetUserId);
                    const targetWs = activeConnections.get(targetUserIdNum);
                    if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                        targetWs.send(JSON.stringify({
                            type: 'callEnded'
                        }));
                    }
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        });

        ws.on('close', async () => {
            if (userId) {
                // Remove from active connections
                activeConnections.delete(userId);
                console.log(`User ${userId} disconnected from calling`);
            }
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    console.log('Call signaling WebSocket server initialized');
    
    return wss;
}

// ============================================
// Helper Functions
// ============================================

// Check if user is online
function isUserOnline(userId) {
    const ws = activeConnections.get(userId);
    return ws && ws.readyState === WebSocket.OPEN;
}

// Get all online users
function getOnlineUsers() {
    const onlineUsers = [];
    activeConnections.forEach((ws, userId) => {
        if (ws.readyState === WebSocket.OPEN) {
            onlineUsers.push(userId);
        }
    });
    return onlineUsers;
}

// Send notification to specific user
function sendToUser(userId, data) {
    const ws = activeConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
        return true;
    }
    return false;
}

// Broadcast message to all connected users
function broadcast(data, excludeUserId = null) {
    activeConnections.forEach((ws, userId) => {
        if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    });
}

module.exports = {
    initializeWebSocket,
    isUserOnline,
    getOnlineUsers,
    sendToUser,
    broadcast
};


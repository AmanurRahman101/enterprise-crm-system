// Agora Service
const RtcTokenBuilder = require('agora-access-token').RtcTokenBuilder;
const RtcRole = require('agora-access-token').RtcRole;

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// Generate RTC token for Agora voice/video calls
const generateToken = (channelName, userId, role = RtcRole.PUBLISHER, expirationTimeInSeconds = 3600) => {
  if (!APP_ID || !APP_CERTIFICATE) {
    throw new Error('Agora credentials not configured');
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    userId,
    role,
    privilegeExpiredTs
  );

  return token;
};

module.exports = {
  generateToken
};


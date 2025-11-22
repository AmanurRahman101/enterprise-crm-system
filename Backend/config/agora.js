// Agora Configuration
// Get your App ID and Certificate from: https://console.agora.io/

const agoraConfig = {
    appId: '19e82f3925d8425bb6681716345f81fd', // Agora App ID
    appCertificate: '24ba179ce91f488ea1a42de386ff3dca', // Agora App Certificate
    
    // Token expiration time (in seconds)
    tokenExpirationTime: 3600, // 1 hour
    
    // Privilege expiration time (in seconds)
    privilegeExpirationTime: 3600 // 1 hour
};

module.exports = agoraConfig;


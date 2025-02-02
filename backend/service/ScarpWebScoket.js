const WebSocket = require('ws');
const scarpingWeb = require('./scarpingService');

// Create WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        // Parse the received data
        const data = JSON.parse(message);

        if (data.secretKeys === process.env.WEBSCOKET_secretKeys) {
            const marketTypes = data.payload.marketTypes;
            const marketTypesDetails = data.payload.marketTypesDetails;
            scarpingWeb(marketTypes, ws, marketTypesDetails);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

module.exports = wss;
console.log('WebSocket server running on ws://localhost:8080');

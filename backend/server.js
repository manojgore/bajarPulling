// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const scarpingWeb = require('./service/scarpingService');
const marketTypesDetails = require('./constants/marketTypesData');
const tableService = require('./service/tableService');

const app = express();
app.use(express.json());

// Configure CORS based on your environment
const corsOptions = {
  origin: process.env.IS_PRODUCTION
    ? process.env.PRODUCTION_FRONTEND_URL
    : process.env.LOCAL_FRONTEND_URL,
  methods: 'GET,POST,PUT,DELETE',
  credentials: true
};
app.use(cors(corsOptions));

// Express routes
app.get('/get-sections', (req, res) => {
  res.status(200).json(marketTypesDetails);
});

app.use('/api', tableService);

// Create a single HTTP server
const server = http.createServer(app);

// Create the WebSocket server and attach it to the same HTTP server
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.secretKeys === process.env.WEBSCOKET_secretKeys) {
        const marketTypes = data.payload.marketTypes;
        const marketTypesDetails = data.payload.marketTypesDetails;
        scarpingWeb(marketTypes, ws, marketTypesDetails);
      }
    } catch (err) {
      console.error('Error processing message', err);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  // ws.send('Welcome to the WebSocket server!');
});

// Start the server only once
const PORT = process.env.SERVER_PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTP server is running on http://localhost:${PORT}`);
  console.log(`WebSocket server attached and running on the same port`);
});

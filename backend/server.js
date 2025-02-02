const express = require('express');
const scarpingWeb = require('./service/scarpingService');
const app = express();
const db = require("./db");
const wss = require("./service/ScarpWebScoket");
const marketTypesDetails = require('./constants/marketTypesData');
// Middleware to parse JSON
app.use(express.json());
const cors = require('cors');

const corsOptions = {
  origin: process.env.IS_PRODUCTION ? process.env.PRODUCTION_FRONTEND_URL : process.env.LOCAL_FRONTEND_URL,
  methods: 'GET,POST,PUT,DELETE',
  credentials: true
};

app.use(cors(corsOptions));

const tableService = require('./service/tableService');

// Define a route
app.get('/get-sections', (req, res) => {
  res.status(200).json(marketTypesDetails);
});

app.use('/api', tableService); 
// Start the server
const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

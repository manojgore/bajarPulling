const express = require('express');
const scarpingWeb = require('./service/scarpingService');
const app = express();
const PORT = 3001;
const db = require("./db");
const wss = require("./service/ScarpWebScoket");
const marketTypesDetails = require('./constants/marketTypesData');
// Middleware to parse JSON
app.use(express.json());
const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:3000',
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
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

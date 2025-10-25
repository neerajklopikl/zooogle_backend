// IMPORTANT: Load environment variables from .env file at the very top
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- Import all your route handlers ---
const partyRoutes = require('./routes/partyRoutes');
const itemRoutes = require('./routes/itemRoutes');
const masterRoutes = require('./routes/masterRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dataRoutes = require('./routes/dataRoutes');
const hsnSacRoutes = require('./routes/hsnSacRoutes');
const reportRoutes = require('./routes/report_routes');

// --- Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware Setup ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- MongoDB Database Connection ---
// Re-enabled connection to MongoDB Atlas from the .env file
const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
  console.error('Error: MONGODB_URI is not defined in your .env file.');
  process.exit(1);
}

console.log('Attempting to connect to MongoDB Atlas cluster...');

// Connect to MongoDB using Mongoose (deprecated options removed)
mongoose.connect(dbURI)
  .then(() => console.log('MongoDB Atlas connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.error('\nThis is a network error. Please ensure your IP address is whitelisted in MongoDB Atlas under "Network Access".');
  });


// --- API Routes ---

app.get('/', (req, res) => {
  res.send('Zooogle Backend API is running...');
});

app.use('/api/parties', partyRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/hsnsac', hsnSacRoutes);
app.use('/api/reports', reportRoutes);


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


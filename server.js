const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const partyRoutes = require('./routes/partyRoutes');
const itemRoutes = require('./routes/itemRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const masterRoutes = require('./routes/masterRoutes');
const dataRoutes =require('./routes/dataRoutes');
const reportRoutes = require('./routes/report_routes');
const hsnSacRoutes = require('./routes/hsnSacRoutes');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Enable CORS
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB using the MONGODB_URI from your .env file
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Define API routes
app.use('/api/parties', partyRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/hsn-sac', hsnSacRoutes);

// Define a simple route for the root
app.get('/', (req, res) => {
  res.send('Welcome to the Zooogle Backend API');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


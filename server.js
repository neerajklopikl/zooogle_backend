const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Import routes
const partyRoutes = require('./routes/partyRoutes');
const itemRoutes = require('./routes/itemRoutes');
const masterRoutes = require('./routes/masterRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dataRoutes = require('./routes/dataRoutes');
const reportRoutes = require('./routes/report_routes');
const hsnSacRoutes = require('./routes/hsnSacRoutes');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// Connect to MongoDB using the MONGODB_URI from your .env file
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define API routes
app.use('/api/parties', partyRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/hsn-sac', hsnSacRoutes);

// Define the port, defaulting to 5000 if not specified in .env
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

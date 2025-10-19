const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');

// Load environment variables from .env file
dotenv.config();

// Initialize the express application
const app = express();

// --- Middleware Setup ---
// Set security-related HTTP headers
app.use(helmet());

// CORS configuration
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction 
    ? ['https://your-production-domain.com'] // Replace with your frontend's production URL
    : ['http://localhost:3000', 'http://localhost:5000']; // Or your flutter dev url

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

// Enable the server to parse incoming JSON data from request bodies
app.use(express.json());

// --- Database Connection ---
// Connect to your MongoDB database using the connection string from your .env file
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected successfully...'))
  .catch(err => console.error('MongoDB Connection Error:', err));


// --- API Routes ---
// This section tells the server which router file to use for which URL path.
// For example, any request starting with /api/transactions will be handled by transactionRoutes.js
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/reports', require('./routes/report_routes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/parties', require('./routes/partyRoutes'));
app.use('/api/masters', require('./routes/masterRoutes'));
app.use('/api/hsn-sac', require('./routes/hsnSacRoutes'));
// --- ADD THIS LINE TO REGISTER THE NEW ROUTE ---
app.use('/api/data', require('./routes/dataRoutes'));


// --- Start the Server ---
// Set the port for the server to listen on, defaulting to 5000 if not specified in .env
const PORT = process.env.PORT || 5000;
// Start listening for incoming requests on the specified port
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

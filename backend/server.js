const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const initSocketServer = require('./socket');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Create HTTP server with Express
const server = http.createServer(app);

// Initialize Socket.IO with HTTP server
const io = initSocketServer(server);

// Make io accessible to route handlers
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Currency exchange rate for TND (Tunisian Dinar)
// This would normally come from an API, but for simplicity we'll hardcode it
const TND_EXCHANGE_RATE = 2.7; // 1 USD = 2.7 TND
app.locals.TND_EXCHANGE_RATE = TND_EXCHANGE_RATE;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1); // Exit with error if database connection fails
  });

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/services', require('./routes/services'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/salons', require('./routes/salons'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/manager', require('./routes/manager'));

// Basic route
app.get('/', (req, res) => {
  res.send('Barbershop API is running');
});

// Port
const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
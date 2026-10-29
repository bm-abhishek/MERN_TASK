const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from server/.env or root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config(); // fallback to current working directory

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB();

// Middlewares
app.use(
  cors({
    origin: '*', // Allows requests from React frontend
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check / welcome endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'MERN Authentication API is running smoothly',
    endpoints: {
      signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      status: 'GET /api/auth/status',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

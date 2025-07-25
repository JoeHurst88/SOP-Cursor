require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cors = require('cors');
const { auth, adminOnly } = require('./middleware/auth');
const User = require('./models/User');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Routes
const authRoutes = require('./routes/auth');
const sopRoutes = require('./routes/sop');

app.use('/api/auth', authRoutes);
app.use('/api/sops', sopRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'SOP Generator API is running' });
});

// Protected routes for testing
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

app.get('/api/admin', auth, adminOnly, (req, res) => {
  res.json({ message: 'This is an admin-only route', user: req.user });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Create admin user function
async function createAdminUser() {
  try {
    console.log('Checking for admin user...');
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      console.log('Creating admin user...');
      const admin = new User({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created successfully');
      console.log('📝 Admin credentials: username=admin, password=admin123');
    } else {
      console.log('✅ Admin user already exists');
      console.log('📝 Admin credentials: username=admin, password=admin123');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

// Setup MongoDB Memory Server and start the application
async function startServer() {
  try {
    // Create MongoDB Memory Server
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    console.log('Connected to in-memory MongoDB');

    // Create admin user after connection is established
    await createAdminUser();

    // Start the server
    const PORT = process.env.PORT || 5001;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🌐 Test the API at http://localhost:${PORT}`);
      console.log(`📱 Frontend should connect to http://localhost:${PORT}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed. Exiting...');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 
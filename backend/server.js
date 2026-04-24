require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

const app = express();

app.use(cors());
app.use(express.json());

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Starting in-memory database for local development...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log('In-Memory MongoDB Connected');
      } catch (fallbackErr) {
        console.error('Failed to connect to in-memory database:', fallbackErr);
        process.exit(1);
      }
    } else {
      console.error('Production database connection failed. Exiting...');
      process.exit(1);
    }
  }
};

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

const path = require('path');
const fs = require('fs');

if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get(/^(.*)$/, (req, res) => {
      res.sendFile(path.resolve(frontendPath, 'index.html'));
    });
  } else {
    app.get('/', (req, res) => res.send('API is running...'));
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

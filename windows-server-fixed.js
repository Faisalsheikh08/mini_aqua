// Simple Windows-compatible server for Question Bank Application
const express = require('express');
const path = require('path');

// Create express app
const app = express();
const port = process.env.PORT || 4000;
const host = '127.0.0.1';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Question Bank Server Running'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working correctly!' });
});

// Catch all handler for React routing (must be last)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Server Error');
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(port, host, () => {
  console.log('✅ Server running successfully at http://' + host + ':' + port);
  console.log('🚀 Question Bank Application is ready!');
  console.log('📁 Serving files from: ' + path.join(__dirname, 'dist', 'public'));
});
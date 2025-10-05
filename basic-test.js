const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(`
    <html>
      <head><title>Windows Test Server</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1 style="color: green;">✅ SUCCESS!</h1>
        <p>Local server is working on Windows!</p>
        <p>Server time: ${new Date().toLocaleString()}</p>
        <p>If you see this, the connection problem is solved!</p>
      </body>
    </html>
  `);
});

server.listen(3333, 'localhost', () => {
  console.log('✅ Basic server running at http://localhost:3333');
  console.log('🎉 If this works, we can fix the main application');
  console.log('📍 Open your browser to: http://localhost:3333');
});

server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.log('Port 3333 is busy, trying port 4444...');
    server.listen(4444, 'localhost');
  }
});
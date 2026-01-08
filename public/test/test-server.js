#!/usr/bin/env node

/**
 * Simple test server for browser integration testing
 * Usage: node public/test/test-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.md': 'text/markdown',
};

const server = http.createServer((req, res) => {
  // Remove query string
  const url = req.url.split('?')[0];
  
  // Default to index.html for root
  const filePath = url === '/' 
    ? path.join(__dirname, 'fortune-randomization-test.html')
    : path.join(__dirname, url.replace(/^\/test\//, ''));
  
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'text/plain';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🎋 Fortune Randomization Test Server`);
  console.log(`📍 Running at: http://localhost:${PORT}/`);
  console.log(`📝 Test page: http://localhost:${PORT}/test/fortune-randomization-test.html`);
  console.log('\nPress Ctrl+C to stop the server');
  console.log('\nNote: Make sure the main app is running on port 3000 for API calls to work');
});

process.on('SIGINT', () => {
  console.log('\n\nShutting down test server...');
  server.close(() => {
    console.log('Test server stopped.');
    process.exit(0);
  });
});
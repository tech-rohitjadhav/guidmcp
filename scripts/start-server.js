#!/usr/bin/env node

/**
 * Script to start the Sequential GUID MCP Server
 */

const { spawn } = require('child_process');
const path = require('path');

// Check if dist directory exists
const fs = require('fs');
const distPath = path.join(__dirname, '../dist');

if (!fs.existsSync(distPath)) {
  console.log('Building project first...');
  const { execSync } = require('child_process');
  execSync('npm run build', { stdio: 'inherit' });
}

console.log('Starting Sequential GUID MCP Server...');
console.log('This server provides SQL Server optimized sequential GUID generation tools.');
console.log('Press Ctrl+C to stop the server.\n');

// Start the server
const serverProcess = spawn('node', ['dist/server.js'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  serverProcess.kill('SIGTERM');
});

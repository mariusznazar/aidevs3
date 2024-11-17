// Import required dependencies
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import proxyRoutes from './routes/proxy.js'
import audioRoutes from './routes/audio.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './utils/logger.js'
import { config } from './config/index.js'
import fileUpload from 'express-fileupload';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' })

// Force development mode
process.env.NODE_ENV = 'development'

// Initialize Express application
const app = express()
app.set('isReady', false)

// Basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)
  next()
})

// Middleware Configuration
app.use(cors(config.server.cors))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
}));

// Add static file serving for media files
app.use('/media', express.static(path.join(process.cwd(), 'src', 'data', 'media')));

// Route Configuration
app.use('/proxy', proxyRoutes)
app.use('/audio', audioRoutes)

// Test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint hit')
  res.json({ message: 'Server is working' })
})

// Error handling
app.use(errorHandler)

// Start server
const port = process.env.PORT || 3000
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
  app.set('isReady', true)
})

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
})

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
})

// Dodaj przed routingiem
app.use((req, res, next) => {
  if (!app.get('isReady')) {
    return res.status(503).json({ 
      error: 'Server is starting up' 
    });
  }
  next();
});

// Dodaj przed innymi routami
app.get('/health', (req, res) => {
  if (!app.get('isReady')) {
    return res.status(503).json({ status: 'starting' });
  }
  res.json({ status: 'ready' });
});
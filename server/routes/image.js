import { Router } from 'express';
import path from 'path';
import { createReadStream } from 'fs';
import fs from 'fs/promises';
import { handleImageAnalysis } from '../controllers/proxy.js';

const router = Router();

// Serve static image files
router.get('/:filename', async (req, res, next) => {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'media', 'image', req.params.filename);
    
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: `File not found: ${req.params.filename}` });
    }

    const stat = await fs.stat(filePath);
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': stat.size
    });

    const readStream = createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// Handle image analysis
router.post('/analyze', handleImageAnalysis);

export default router; 
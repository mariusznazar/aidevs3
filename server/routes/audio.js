import { Router } from 'express';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

const router = Router();

router.get('/przesluchania', async (req, res, next) => {
  try {
    const audioDir = path.join(process.cwd(), 'src', 'data', 'media', 'audio', 'przesluchania');
    logger.debug('Checking directory:', audioDir);
    
    try {
      await fs.access(audioDir);
      logger.debug('Directory is accessible');
    } catch (error) {
      logger.error('Directory access error:', error);
      return res.status(404).json({ error: `Directory not found: ${audioDir}` });
    }
    
    const files = await fs.readdir(audioDir);
    logger.debug('Files found in directory:', files);
    
    const audioFiles = files.filter(file => 
      file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.m4a')
    );
    logger.debug('Audio files after filtering:', audioFiles);
    
    if (audioFiles.length === 0) {
      logger.debug('No audio files found after filtering');
      return res.status(404).json({ error: 'No audio files found in directory' });
    }
    
    logger.debug('Sending response with audio files');
    res.json(audioFiles);
  } catch (error) {
    logger.error('Error in /przesluchania route:', error);
    next(error);
  }
});

router.get('/przesluchania/:filename', async (req, res, next) => {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'media', 'audio', 'przesluchania', req.params.filename);
    
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: `File not found: ${req.params.filename}` });
    }

    const stat = await fs.stat(filePath);
    res.writeHead(200, {
      'Content-Type': req.params.filename.endsWith('.txt') ? 'text/plain' : 'audio/mpeg',
      'Content-Length': stat.size
    });

    const readStream = createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// Endpoint do zapisywania transkrypcji
router.post('/save', async (req, res, next) => {
  try {
    const { path: filePath, content } = req.body;
    const fullPath = path.join(process.cwd(), 'src', 'data', 'media', filePath);
    
    // Upewnij się, że katalog istnieje
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    await fs.writeFile(fullPath, content, 'utf8');
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router; 
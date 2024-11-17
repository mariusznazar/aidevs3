import axios from 'axios'
import { logger } from '../utils/logger.js'
import { LLMConfig } from '../utils/llmHelpers.js';
import FormData from 'form-data';

/**
 * Handles fetching challenge questions from the XYZ Company API
 * Acts as a proxy to avoid CORS issues and add necessary headers
 */
export const handleQuestion = async (req, res, next) => {
  try {
    logger.debug('Fetching question')
    logger.debug(`Using URL: ${process.env.VITE_XYZ_COMPANY_URL}`);
    // Make GET request to company API with required User-Agent header
    const response = await axios.get(process.env.VITE_XYZ_COMPANY_URL, {
      headers: {
        'User-Agent': process.env.VITE_USER_AGENT // Required to mimic browser behavior
      }
    })
    res.send(response.data)
  } catch (error) {
    next(error) // Pass errors to global error handler
  }
}

/**
 * Handles login attempts to the XYZ Company system
 * Forwards login credentials and challenge response to company API
 * Includes necessary headers to simulate browser behavior
 */
export const handleLogin = async (req, res, next) => {
  try {
    logger.debug('Processing login')
    // Make POST request with form data and required headers
    const response = await axios.post(process.env.VITE_XYZ_COMPANY_URL, req.body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Required for form submission
        'User-Agent': process.env.VITE_USER_AGENT,
        'Origin': process.env.VITE_XYZ_COMPANY_URL, // Simulate request coming from company domain
        'Referer': `${process.env.VITE_XYZ_COMPANY_URL}/` // Required for security validation
      }
    })
    res.send(response.data)
  } catch (error) {
    next(error)
  }
}

/**
 * Handles communication with Language Learning Model (LLM) API
 * Forwards messages to specified API endpoint with proper authentication
 * Applies configured model parameters (temperature, max tokens, etc.)
 */
export const handleLLM = async (req, res, next) => {
  try {
    const { messages, apiEndpoint } = req.body;
    const apiKey = req.headers['x-openai-key'];
    
    if (!messages || !apiEndpoint || !apiKey) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    logger.debug('Sending request to LLM');
    const response = await axios.post(
      apiEndpoint,
      {
        messages,
        model: LLMConfig.model,
        temperature: LLMConfig.temperature,
        max_tokens: LLMConfig.max_tokens
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    logger.error('LLM Error:', error.response?.data || error.message);
    next(error);
  }
};

/**
 * Handles verification requests to XYZ Company API
 * Used for additional security checks or user verification steps
 * Forwards verification data with required headers
 */
export const handleVerify = async (req, res, next) => {
  try {
    logger.debug('Processing verification')
    // Make POST request to verification endpoint
    const response = await axios.post(`${process.env.VITE_XYZ_COMPANY_URL}/verify`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': process.env.VITE_USER_AGENT // Maintain consistent browser identity
      }
    })
    res.send(response.data)
  } catch (error) {
    next(error)
  }
}

/**
 * Handles audio transcription requests to the XYZ Company API
 * Forwards audio files to specified API endpoint with proper authentication
 * Applies configured model parameters (temperature, max tokens, etc.)
 */
export const handleTranscribe = async (req, res, next) => {
  try {
    console.log('Received transcription request');
    
    if (!req.files || !req.files.file) {
      console.log('Files in request:', req.files);
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const apiKey = req.headers['x-openai-key'];
    if (!apiKey) {
      return res.status(400).json({ error: 'Missing API key' });
    }

    const form = new FormData();
    form.append('file', req.files.file.data, {
      filename: req.files.file.name,
      contentType: req.files.file.mimetype
    });
    form.append('model', 'whisper-1');

    console.log('Sending request to OpenAI');
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      form,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...form.getHeaders()
        }
      }
    );

    console.log('Received response from OpenAI');
    res.json(response.data);
  } catch (error) {
    console.error('Transcription error:', error);
    next(error);
  }
};

/**
 * Handles image analysis requests to the XYZ Company API
 * Forwards image files to specified API endpoint with proper authentication
 * Applies configured model parameters (temperature, max tokens, etc.)
 */
export const handleImageAnalysis = async (req, res, next) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const apiKey = req.headers['x-openai-key'];
    if (!apiKey) {
      return res.status(400).json({ error: 'Missing API key' });
    }

    // Convert image to base64
    const imageBase64 = req.files.file.data.toString('base64');
    const messages = JSON.parse(req.body.messages);

    // Add image URL to the user's message content
    const userMessage = messages.find(m => m.role === 'user');
    if (userMessage) {
      userMessage.content = [
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: "high"
          }
        },
        {
          type: "text",
          text: userMessage.content
        }
      ];
    }

    const requestBody = {
      model: "gpt-4o",
      messages: messages,
      max_tokens: 4000
    };

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Image analysis error details:', error.response?.data || error);
    next(error);
  }
};

/**
 * Handles robot ID requests to the XYZ Company API
 * Forwards robot ID data with required headers
 */
export const handleRobotId = async (req, res, next) => {
  try {
    logger.debug(`Fetching from: ${process.env.VITE_CENTRAL_URL}/data/${process.env.VITE_DEFAULT_API_KEY}/robotid.json`);
    const response = await axios.get(
      `${process.env.VITE_CENTRAL_URL}/data/${process.env.VITE_DEFAULT_API_KEY}/robotid.json`
    );
    logger.debug('Response:', response.data);
    res.json(response.data);
  } catch (error) {
    logger.error('Error:', error.response?.data || error);
    next(error);
  }
};

/**
 * Handles image generation requests to the XYZ Company API
 * Forwards image generation data to specified API endpoint with proper authentication
 * Applies configured model parameters (temperature, max tokens, etc.)
 */
export const handleImageGeneration = async (req, res, next) => {
  try {
    console.log('Raw request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request method:', req.method);
    
    const { prompt } = req.body;
    console.log('Extracted prompt:', prompt);
    
    const apiKey = req.headers['x-openai-key'];
    if (!apiKey) {
      return res.status(400).json({ error: 'Missing API key' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt parameter' });
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url"
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Image generation error:', error.response?.data || error);
    next(error);
  }
}; 
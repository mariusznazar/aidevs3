import { useState, useCallback } from 'react';
import axios from 'axios';
import '../styles/RobotImageGenerator.css';
import { createLLMMessages } from '../utils/llmHelpers';
import { LLMPrompts } from '../utils/llmPrompts';

interface RobotDescription {
  description: string;
}

interface ImageGenerationResult {
  originalDescription: string;
  imageUrl: string;
  processingTime: number;
}

export function RobotImageGenerator() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const [error, setError] = useState<string>('');

  const generateRobotImage = useCallback(async () => {
    const startTime = Date.now();
    setProcessing(true);
    setError('');

    try {
      // Fetch robot description from central API
      const response = await axios.get<RobotDescription>(
        'http://localhost:3000/proxy/robotid'
      );

      const robotDescription = response.data.description;
      const template = LLMPrompts.imageGeneration.userMessageTemplate;
      const formattedPrompt = template.replace('{input}', robotDescription);
      const messages = createLLMMessages('imageGeneration', formattedPrompt);
      console.log('Messages:', messages);
      const fullPrompt = messages[messages.length - 1].content;
      console.log('Sending request with prompt:', { prompt: fullPrompt });

      // Dodajmy sprawdzenie czy prompt nie jest pusty
      if (!fullPrompt) {
        throw new Error('Failed to generate prompt from robot description');
      }

      // Generate image using DALL-E
      const imageResponse = await axios.post(
        'http://localhost:3000/proxy/generate-image',
        JSON.stringify({ prompt: fullPrompt }),
        {
          headers: {
            'x-openai-key': import.meta.env.VITE_OPENAI_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const imageUrl = imageResponse.data.data[0].url;

      // Submit result to central API
      await axios.post(
        `${import.meta.env.VITE_CENTRAL_URL}/report`,
        {
          task: 'robotid',
          apikey: import.meta.env.VITE_DEFAULT_API_KEY,
          answer: imageUrl
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      // Calculate processing time and update results
      const processingTime = (Date.now() - startTime) / 1000;
      setResult({
        originalDescription: robotDescription,
        imageUrl,
        processingTime
      });
    } catch (err) {
      setError(`Processing failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessing(false);
    }
  }, []);

  return (
    <div className="robot-image-generator">
      <h2>Robot Image Generator</h2>
      <p>Generate robot images based on descriptions using DALL-E.</p>
      
      <div className="actions">
        <button onClick={generateRobotImage} disabled={processing}>
          {processing ? 'Generating...' : 'Generate Robot Image'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="results">
          <h3>Generation Results</h3>
          <div className="stats">
            <p>Processing time: {result.processingTime.toFixed(2)} seconds</p>
          </div>
          <div className="description">
            <h4>Original Description</h4>
            <pre>{result.originalDescription}</pre>
          </div>
          <div className="generated-image">
            <h4>Generated Image</h4>
            <img src={result.imageUrl} alt="Generated robot" />
          </div>
        </div>
      )}
    </div>
  );
} 
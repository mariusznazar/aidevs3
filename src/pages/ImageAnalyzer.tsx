import { useState } from 'react';
import axios from 'axios';
import { LLMService } from '../services/llm/LLMService';
import { createLLMMessages } from '../utils/llmHelpers';
import '../styles/ImageAnalyzer.css';

interface ImageAnalyzerProps {
  llmService: LLMService;
}

export function ImageAnalyzer({ llmService }: ImageAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const analyzeImage = async () => {
    try {
      setAnalyzing(true);
      setError('');

      // Get the image file
      const response = await fetch('/src/data/media/image/AI DEVS3 map.png');
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('Image blob type:', blob.type); // Debug log
      const imageFile = new File([blob], 'AI DEVS3 map.png', { type: blob.type });

      // Create messages for LLM
      const messages = createLLMMessages(
        'imageAnalysis',
        'Na mapie są 4 fragmenty map. Jedna z nich jest z innego miasta niż pozostałe. To są miasta z Polski. ',
        { preserveSystemPrompt: true }
      );

      // Get analysis from LLM
      const analysis = await llmService.analyzeImage(imageFile, messages);

      // Update UI with results
      setResult(analysis);

      // Submit results to central server
      await axios.post(
        `/central/report`,
        {
          task: 'image',
          apikey: import.meta.env.VITE_DEFAULT_API_KEY,
          answer: analysis
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

    } catch (err) {
      setError(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="image-analyzer">
      <h2>Image Analyzer</h2>
      <p>Analyze images using AI vision capabilities.</p>
      
      <div className="actions">
        <button onClick={analyzeImage} disabled={analyzing}>
          {analyzing ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="results">
          <h3>Analysis Results</h3>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
} 
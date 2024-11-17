import { useState } from 'react';
import axios from 'axios';
import { LLMService } from '../services/llm/LLMService';
import { createLLMMessages } from '../utils/llmHelpers';
import '../styles/AudioProcessor.css';

interface Transcription {
  filename: string;
  transcription: string;
}

export function AudioProcessor({ llmService }: { llmService: LLMService }) {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [summary, setSummary] = useState<string>('');

  const processAudioFiles = async () => {
    console.log('Starting audio processing...');
    try {
      setProcessing(true);
      setError('');

      const response = await axios.get('/audio/przesluchania');
      const audioFiles = Array.isArray(response.data) ? response.data : 
                        Array.isArray(response.data.files) ? response.data.files : [];

      if (audioFiles.length === 0) {
        throw new Error('No audio files found in the directory');
      }

      const newTranscriptions: Transcription[] = [];

      for (const fileName of audioFiles) {
        const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
        const transcriptionPath = `/audio/przesluchania/${baseName}_transcription.txt`;
        
        let transcription: string;

        try {
          const existingTranscription = await axios.get(transcriptionPath);
          transcription = existingTranscription.data;
        } catch {
          const audioResponse = await fetch(`/audio/przesluchania/${fileName}`);
          const audioBlob = await audioResponse.blob();
          const audioFile = new File([audioBlob], fileName, { type: 'audio/m4a' });

          transcription = await llmService.transcribeAudio(audioFile);

          await axios.post('/audio/save', {
            path: transcriptionPath,
            content: transcription
          });
        }

        newTranscriptions.push({
          filename: fileName,
          transcription
        });
      }

      setTranscriptions(newTranscriptions);
      
      const context = newTranscriptions.map(t => t.transcription).join('\n\n');
      console.log('Context for analysis:', context);
      
      const messages = createLLMMessages('audioAnalysis', 
        'Podaj nam proszę nazwę ulicy, na której znajduje się uczelnia, gdzie wykłada profesor.',
        { context }
      );
      
      console.log('Messages for LLM:', messages);

      try {
        const llmResponse = await llmService.generateText(messages);
        console.log('LLM Response:', llmResponse);
        setSummary(llmResponse);

        const reportPayload = {
          task: 'mp3',
          apikey: import.meta.env.VITE_DEFAULT_API_KEY,
          answer: llmResponse
        };

        await axios.post(
          `/central/report`,
          reportPayload,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

      } catch (llmError) {
        console.error('LLM Error:', llmError);
        setError(`LLM processing failed: ${llmError instanceof Error ? llmError.message : String(llmError)}`);
      }
      
      setProcessing(false);
    } catch (error) {
      console.error('Processing error:', error);
      setError(`Processing failed: ${error instanceof Error ? error.message : String(error)}`);
      setProcessing(false);
    }
  };

  return (
    <div className="audio-processor">
      <h1>Audio Processor</h1>
      
      <div className="actions">
        <button
          onClick={processAudioFiles}
          disabled={processing}
        >
          {processing ? 'Processing...' : 'Process Audio Files'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {transcriptions.length > 0 && (
        <div className="results">
          <h2>Transcriptions:</h2>
          {transcriptions.map((t, i) => (
            <div key={i} className="transcription">
              <h4>{t.filename}</h4>
              <pre>{t.transcription}</pre>
            </div>
          ))}
        </div>
      )}

      {summary && (
        <div className="summary">
          <h3>Analysis:</h3>
          <pre>{summary}</pre>
        </div>
      )}
    </div>
  );
} 
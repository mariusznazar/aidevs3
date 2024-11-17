import { useState, useCallback } from 'react'
import axios from 'axios'
import '../styles/JsonProcessor.css'
import { createLLMMessages } from '../utils/llmHelpers'
import { LLMService } from '../services/llm/LLMService'

interface CensorshipResult {
  originalText: string
  censoredText: string
  processingTime: number
}

// Add this helper function at the top of the file
const cleanupCensoredText = (text: string): string => {
  return text.replace(/CENZURA(\s+CENZURA)+/g, 'CENZURA');
}

// Add type for LLM messages
type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CensorshipProps {
  llmService: LLMService;
}

export const Censorship = ({ llmService }: CensorshipProps) => {
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<CensorshipResult | null>(null)
  const [error, setError] = useState<string>('')

  const processCensorship = useCallback(async () => {
    const startTime = Date.now()
    setProcessing(true)
    setError('')

    try {
      const response = await axios.get(
        `/central/data/${import.meta.env.VITE_DEFAULT_API_KEY}/cenzura.txt`
      )

      const originalText = response.data
      const messages: Message[] = createLLMMessages('censorship', originalText)
      const censoredText = await llmService.generateText(messages)

      // Clean up the censored text before using it
      const cleanedCensoredText = cleanupCensoredText(censoredText)

      // Submit censored data back to server
      const reportPayload = {
        task: 'CENZURA',
        apikey: import.meta.env.VITE_DEFAULT_API_KEY,
        answer: cleanedCensoredText
      }

      await axios.post(
        `/central/report`,
        reportPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      // Calculate processing time and update results
      const processingTime = (Date.now() - startTime) / 1000
      setResult({
        originalText,
        censoredText: cleanedCensoredText,
        processingTime
      })
    } catch (err) {
      setError(`Processing failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setProcessing(false)
    }
  }, [llmService])

  return (
    <div className="json-processor">
      <h2>Text Censorship Processor</h2>
      <p>Process text files by censoring personal information.</p>
      
      <div className="actions">
        <button onClick={processCensorship} disabled={processing}>
          {processing ? 'Processing...' : 'Process Censorship'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="results">
          <h3>Processing Results</h3>
          <div className="stats">
            <p>Processing time: {result.processingTime.toFixed(2)} seconds</p>
          </div>
          <div className="text-results">
            <div className="text-section">
              <h4>Original Text</h4>
              <pre>{result.originalText}</pre>
            </div>
            <div className="text-section">
              <h4>Censored Text</h4>
              <pre>{result.censoredText}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
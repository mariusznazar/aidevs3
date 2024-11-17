import { useState, useCallback } from 'react'
import axios from 'axios'
import '../styles/JsonProcessor.css'
import { createLLMMessages } from '../utils/llmHelpers';
import type { ProcessedResult } from '../types/json';

export function JsonProcessor() {
  // State management
  const [processing, setProcessing] = useState(false)  // Controls processing state and UI feedback
  const [result, setResult] = useState<ProcessedResult | null>(null)  // Stores processing results
  const [error, setError] = useState<string>('')  // Handles error messages

  // Safely evaluates mathematical expressions
  // Returns 0 if evaluation fails
  // Only allows basic math operators: +, -, *, /
  const evaluateMathExpression = (expression: string): number => {
    try {
      // Remove any potentially dangerous characters, only keep numbers and basic operators
      const sanitizedExp = expression.replace(/[^0-9+\-*/\s]/g, '')
      return Function(`'use strict'; return (${sanitizedExp})`)()
    } catch (err) {
      console.error('Math evaluation error:', err)
      return 0
    }
  }

  // Main processing function
  // Handles the entire JSON processing workflow:
  // 1. Fetches JSON data from API
  // 2. Processes math expressions
  // 3. Handles LLM integrations
  // 4. Submits results back to server
  const processJsonData = useCallback(async () => {
    const startTime = Date.now()
    setProcessing(true)
    setError('')

    try {
      // Fetch initial JSON data from the server
      const response = await axios.get(
        `/central/data/${import.meta.env.VITE_DEFAULT_API_KEY}/json.txt`
      )

      const responseData = response.data
      // Create deep copy to avoid mutating original data
      const modifiedData = {
        ...responseData,
        'test-data': [...responseData['test-data']]
      }

      // Update API key if default placeholder is present
      if (modifiedData.apikey === '%PUT-YOUR-API-KEY-HERE%') {
        modifiedData.apikey = import.meta.env.VITE_DEFAULT_API_KEY
      }

      // Counters for tracking changes
      let mathCorrections = 0  // Number of math expressions corrected
      let llmAnswers = 0      // Number of LLM responses generated

      // Process each item in the test data array
      for (let i = 0; i < modifiedData['test-data'].length; i++) {
        const item = modifiedData['test-data'][i]

        // Handle mathematical expressions
        // Identifies expressions containing only numbers and basic operators
        if (/^[\d\s+\-*/()]+$/.test(item.question)) {
          const correctAnswer = evaluateMathExpression(item.question)
          if (correctAnswer !== item.answer) {
            item.answer = correctAnswer
            mathCorrections++
          }
        }

        // Handle LLM-required responses
        // Processes items where test.a is marked with '???'
        if (item.test && item.test.a === '???') {
          const messages = createLLMMessages('jsonProcessor', item.test.q);

          // Send request to LLM proxy endpoint
          const llmResponse = await axios.post(
            'http://localhost:3000/proxy/llm',
            {
              messages,
              apiEndpoint: import.meta.env.VITE_LLM_API_ENDPOINT
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-openai-key': import.meta.env.VITE_OPENAI_API_KEY
              }
            }
          )

          item.test.a = llmResponse.data.choices[0].message.content.trim()
          llmAnswers++
        }
      }

      // Prepare final report with processed data
      const reportPayload = {
        task: 'JSON',
        apikey: import.meta.env.VITE_DEFAULT_API_KEY,
        answer: modifiedData  // Sending unstrungified object
      }

      // Submit processed data back to server
      await axios.post(
        `/central/report`, 
        reportPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      // Calculate total processing time
      const processingTime = (Date.now() - startTime) / 1000

      // Update UI with results and statistics
      setResult({
        originalData: responseData['test-data'],
        modifiedData,
        stats: {
          totalItems: responseData['test-data'].length,
          mathCorrections,
          llmAnswers,
          processingTime
        }
      })
    } catch (err) {
      setError(`Processing failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setProcessing(false)
    }
  }, [])

  // Component render
  // Displays:
  // - Processing button
  // - Error messages
  // - Processing results and statistics
  return (
    <div className="json-processor">
      <h2>JSON Data Processor</h2>
      <p>Process JSON data with math expressions validation and LLM integration.</p>
      
      <div className="actions">
        <button onClick={processJsonData} disabled={processing}>
          {processing ? 'Processing...' : 'Process JSON Data'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="results">
          <h3>Processing Results</h3>
          <div className="stats">
            <p>Total items processed: {result.stats.totalItems}</p>
            <p>Math corrections made: {result.stats.mathCorrections}</p>
            <p>LLM answers provided: {result.stats.llmAnswers}</p>
            <p>Processing time: {result.stats.processingTime.toFixed(2)} seconds</p>
          </div>
        </div>
      )}
    </div>
  )
}
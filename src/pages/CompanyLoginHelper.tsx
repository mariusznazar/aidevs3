import { useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import '../styles/CompanyLoginHelper.css'
import { createLLMMessages } from '../utils/llmHelpers';

// Interface for OpenAI API responses - defines the expected structure
// of responses from the language model service
interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

// Main component for automated company login process
// Handles the complete authentication flow including:
// - Fetching and refreshing challenge questions
// - Getting AI-generated answers
// - Submitting login attempts
// - Managing firmware download on successful login
export function CompanyLoginHelper() {
  // Debug logging for environment variables
  // Helps verify that all required credentials and API keys are present
  console.log('🌟 Component mounted 🌟')
  console.log('Environment variables:', {
    username: import.meta.env.VITE_USERNAME,
    hasPassword: !!import.meta.env.VITE_PASSWORD,
    hasOpenAIKey: !!import.meta.env.VITE_OPENAI_API_KEY,
    hasLLMEndpoint: !!import.meta.env.VITE_LLM_API_ENDPOINT
  })

  // State Management
  // question: Stores the current challenge question from the server
  // llmAnswer: Stores the AI-generated response to the challenge
  // error: Holds any error messages for display to the user
  // timeLeft: Countdown timer (in seconds) until next question refresh
  // lastQuestionTime: Timestamp to track when question was last updated
  // downloadUrl: Stores the URL for firmware download after successful login
  const [question, setQuestion] = useState<string>('')
  const [llmAnswer, setLlmAnswer] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState(7)
  const [lastQuestionTime, setLastQuestionTime] = useState(Date.now())
  const [downloadUrl, setDownloadUrl] = useState<string>('')

  // Parses HTML response to extract the challenge question
  // Attempts to find text following "Question:" pattern
  // Falls back to using full text content if pattern isn't found
  const extractQuestionFromHtml = useCallback((html: string): string => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      
      // Looking for text "Question:" and taking the next text
      const text = doc.body.textContent || ''
      const questionMatch = text.match(/Question:([^?]+)\?/)
      
      if (questionMatch && questionMatch[1]) {
        return questionMatch[1].trim() + '?'
      }
      
      // Fallback: if we don't find "Question:", return all text
      return text.trim()
    } catch (error) {
      console.error('Error parsing HTML:', error)
      return ''
    }
  }, [])

  // Polls the server for new questions
  // Returns true if a new question was successfully fetched and processed
  // Used both for initial question fetch and periodic updates
  const checkNewQuestion = useCallback(async () => {
    const newQuestion = await getNewQuestion()
    return !!newQuestion
  }, [])

  // Makes API request to fetch new challenge question
  // Returns the question string if successful, null otherwise
  // Updates related state (question, timestamp, timer) on success
  const getNewQuestion = async (): Promise<string | null> => {
    try {
      // Make API request to get question
      const response = await axios.get('http://localhost:3000/proxy/question', {
        responseType: 'text'
      })
      
      // Extract question from HTML response
      const newQuestion = extractQuestionFromHtml(response.data)
      console.log('Extracted new question:', newQuestion)
      
      // Update state if question found
      if (newQuestion) {
        setQuestion(newQuestion)
        setLastQuestionTime(Date.now())
        setTimeLeft(7)
        return newQuestion
      }
      
      return null
    } catch (error) {
      console.error('Error getting new question:', error)
      return null
    }
  }

  // Requests AI-generated answer for current question
  // Uses OpenAI API through proxy endpoint with proper authentication
  // Updates llmAnswer state with the cleaned response
  const handleGetLLMAnswer = async () => {
    if (!question) {
      setError('No question available')
      return
    }

    try {
      // Create messages for LLM using shortAnswer template
      const messages = createLLMMessages('shortAnswer', question);
      
      // Make API request to LLM service
      const response = await axios.post<OpenAIResponse>(
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
      
      // Process and store LLM response
      const cleanAnswer = response.data.choices[0].message.content.trim()
      setLlmAnswer(cleanAnswer)
      setError('')
    } catch (err) {
      setError('Failed to get LLM answer: ' + (err instanceof Error ? err.message : String(err)))
      console.error('LLM error:', err)
    }
  }

  // Main login sequence handler
  // Executes the complete authentication flow:
  // 1. Fetches fresh challenge question
  // 2. Gets AI-generated answer
  // 3. Submits login credentials with answer
  // 4. Processes response and initiates firmware download if successful
  const handleLogin = async () => {
    try {
      setError('')
      
      // 1. Get new question
      const questionResponse = await axios.get('http://localhost:3000/proxy/question', {
        responseType: 'text'
      })
      const newQuestion = extractQuestionFromHtml(questionResponse.data)
      setQuestion(newQuestion)
      
      // 2. Get LLM response
      const llmResponse = await axios.post<OpenAIResponse>(
        'http://localhost:3000/proxy/llm',
        { 
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: `Give me just the number or very short answer without any additional text or explanation: ${newQuestion}` }
          ],
          apiEndpoint: import.meta.env.VITE_LLM_API_ENDPOINT
        },
        { 
          headers: {
            'Content-Type': 'application/json',
            'x-openai-key': import.meta.env.VITE_OPENAI_API_KEY
          }
        }
      )
      const cleanAnswer = llmResponse.data.choices[0].message.content.trim()
      setLlmAnswer(cleanAnswer)

      // 3. Perform login
      const formData = new URLSearchParams()
      formData.append('username', import.meta.env.VITE_USERNAME)
      formData.append('password', import.meta.env.VITE_PASSWORD)
      formData.append('answer', cleanAnswer)
      
      const loginResponse = await axios.post(
        'http://localhost:3000/proxy/login',
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          responseType: 'text'
        }
      )

      // Check if the response contains a link to firmware
      if (loginResponse.data.includes('href="/files/0_13_4b.txt"')) {
        const blob = new Blob([loginResponse.data], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        setDownloadUrl(url)
        
        const a = document.createElement('a')
        a.href = url
        a.download = 'firmware.html'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        setError('')
      } else {
        setError('Login failed: Invalid response')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`Login sequence failed: ${errorMessage}`)
    }
  }

  // Effects

  // Countdown Timer Effect
  // Updates the timeLeft state every second
  // Shows time remaining until next question refresh
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastQuestionTime) / 1000)
      const remaining = Math.max(0, 7 - elapsed)
      setTimeLeft(remaining)
    }, 1000)

    return () => clearInterval(timer)
  }, [lastQuestionTime])

  // Question Polling Effect
  // Automatically checks for new questions every 7 seconds
  // Ensures challenge questions stay fresh
  useEffect(() => {
    checkNewQuestion()
    const interval = setInterval(checkNewQuestion, 7000)
    return () => clearInterval(interval)
  }, [checkNewQuestion])

  // Cleanup Effect
  // Prevents memory leaks by revoking object URLs
  // Runs when component unmounts or downloadUrl changes
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        window.URL.revokeObjectURL(downloadUrl)
      }
    }
  }, [downloadUrl])

  // UI Helper Functions

  // Determines CSS class for timer display
  // Returns appropriate styling based on remaining time:
  // - 'danger' for <= 2 seconds
  // - 'warning' for <= 4 seconds
  // - default otherwise
  const getTimerClassName = () => {
    if (timeLeft <= 2) return 'timer danger'
    if (timeLeft <= 4) return 'timer warning'
    return 'timer'
  }

  return (
    <div className="company-login-helper">
      <div className="actions">
        <button onClick={checkNewQuestion}>Get New Question</button>
        <button onClick={handleGetLLMAnswer} disabled={!question}>
          Get LLM Answer
        </button>
        <button onClick={handleLogin} disabled={!llmAnswer}>
          Login
        </button>
      </div>

      <div className={getTimerClassName()}>Time until next question: {timeLeft}s</div>

      {error && <div className="error-message">{error}</div>}

      <div className="results">
        {question && (
          <div className="result-item">
            <h3>Current Question</h3>
            <p>{question}</p>
          </div>
        )}

        {llmAnswer && (
          <div className="result-item">
            <h3>LLM Answer</h3>
            <p>{llmAnswer}</p>
          </div>
        )}

        {downloadUrl && (
          <div className="result-item">
            <h3>Download Link</h3>
            <a href={downloadUrl} download="firmware.html">
              Download firmware.html
            </a>
          </div>
        )}
      </div>
    </div>
  )
} 
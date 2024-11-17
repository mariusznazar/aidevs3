import { useState } from 'react'
import axios from 'axios'
import '../styles/RobotVerification.css'
import { createLLMMessages } from '../utils/llmHelpers';

// Define the structure for messages in the verification process
interface Message {
  text: string
  msgID: string
}

// Component for handling robot verification process
// Define the structure for messages in the verification process
// text: The actual message content
// msgID: Unique identifier for message tracking and response matching
interface Message {
  text: string
  msgID: string
}

// Component for handling robot verification process
// Implements a back-and-forth conversation between the system (ISTOTA) and an AI (ROBOT)
// Uses LLM to generate appropriate responses to verification challenges
export function RobotVerification() {
  // State Management
  const [messages, setMessages] = useState<Message[]>([])  // Stores full conversation history
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null)  // Current message awaiting response
  const [llmResponse, setLlmResponse] = useState<string>('')  // Stores AI-generated response
  const [error, setError] = useState<string>('')  // Handles error messages

  // Initiates the verification procedure
  // Sends initial "READY" message to the server and awaits first challenge
  const handleStartProcedure = async () => {
    try {
      // Create initial message to start the verification process
      const initialMessage = {
        text: 'READY',
        msgID: '0'
      }
      
      // Send initial message and get first challenge
      const response = await axios.post('http://localhost:3000/proxy/verify', initialMessage)
      setCurrentMessage(response.data)  // Store the challenge message
      setMessages(prev => [...prev, initialMessage, response.data])  // Add both messages to history
    } catch (err) {
      setError('Failed to start procedure: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  // Generates AI response to current challenge
  // Uses OpenAI's GPT-4 to create appropriate responses to verification questions
  const handleGenerateResponse = async () => {
    if (!currentMessage) {
      setError('No current message to respond to')
      return
    }

    try {
      // Create messages array for LLM context
      const messages = createLLMMessages('robotVerification', currentMessage.text);
      
      // Prepare request for OpenAI API
      const requestBody = {
        model: "gpt-4",
        messages
      }
      
      console.log('Sending LLM request:', requestBody)

      // Send request to OpenAI API
      const response = await axios.post(
        import.meta.env.VITE_LLM_API_ENDPOINT,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
          }
        }
      )

      console.log('LLM response:', response.data)
      setLlmResponse(response.data.choices[0].message.content)  // Store generated response
    } catch (err) {
      setError('Failed to generate response: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  // Sends the generated AI response back to the verification server
  // Handles the response and prepares for next challenge if applicable
  const handleSendResponse = async () => {
    if (!currentMessage || !llmResponse) {
      setError('No response to send')
      return
    }

    try {
      // Prepare response message with current message ID
      const responseMessage = {
        text: llmResponse,
        msgID: currentMessage.msgID
      }

      // Send response and get next challenge
      const response = await axios.post('http://localhost:3000/proxy/verify', responseMessage)
      setCurrentMessage(response.data)  // Store new challenge
      setMessages(prev => [...prev, responseMessage, response.data])  // Add to conversation history
      setLlmResponse('')  // Clear current response for next round
    } catch (err) {
      setError('Failed to send response: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  // Component render
  // Displays:
  // - Action buttons for controlling the verification flow
  // - Error messages
  // - Full conversation history between ISTOTA and ROBOT
  // - Currently generated LLM response (if any)
  return (
    <div className="robot-verification">
      {/* Action buttons section */}
      <div className="actions">
        <button onClick={handleStartProcedure}>Start Procedure</button>
        <button 
          onClick={handleGenerateResponse} 
          disabled={!currentMessage}  // Disabled if no current challenge
        >
          Generate Response
        </button>
        <button 
          onClick={handleSendResponse} 
          disabled={!llmResponse || !currentMessage}  // Disabled if no response generated
        >
          Send Response
        </button>
      </div>

      {/* Error message display */}
      {error && <div className="error-message">{error}</div>}

      {/* Conversation history display */}
      <div className="conversation">
        <h3>Conversation History</h3>
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <strong>{index % 2 === 0 ? 'ISTOTA' : 'ROBOT'}:</strong>  {/* Alternates between ISTOTA and ROBOT */}
            <pre>{JSON.stringify(msg, null, 2)}</pre>
          </div>
        ))}
      </div>

      {/* Generated response display */}
      {llmResponse && (
        <div className="llm-response">
          <h3>Generated Response</h3>
          <pre>{llmResponse}</pre>
        </div>
      )}
    </div>
  )
} 
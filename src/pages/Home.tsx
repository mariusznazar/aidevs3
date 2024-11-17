import { Link } from 'react-router-dom'

interface Tool {
  id: string;
  title: string;
  description: string;
  icon?: string; // możemy dodać później ikony
}

const tools: Tool[] = [
  {
    id: 'company_login_helper',
    title: 'Company Login Helper',
    description: 'Automated tool for handling company login process.'
  },
  {
    id: 'robot_verification',
    title: 'Robot Verification',
    description: 'Tool for handling robot verification process.'
  },
  {
    id: 'json_processor',
    title: 'JSON Processor',
    description: 'Process and validate JSON data with math expressions and LLM integration.'
  },
  {
    id: 'censorship',
    title: 'Censorship',
    description: 'Tool for censoring sensitive information in text.'
  },
  {
    id: 'audio_processor',
    title: 'Audio Processor',
    description: 'Process and analyze audio interrogation files using AI transcription.'
  },
  {
    id: 'image_analyzer',
    title: 'Image Analyzer',
    description: 'Analyze images using AI vision capabilities.'
  },
  {
    id: 'robot_image_generator',
    title: 'Robot Image Generator',
    description: 'Generate robot images using DALL-E based on descriptions.'
  }
];

export function Home() {
  return (
    <div className="home-container">
      <h1>Training Tools Dashboard</h1>
      <p>Select a tool to get started with your task.</p>
      
      <div className="tools-grid">
        {tools.map(tool => (
          <div key={tool.id} className="tool-card">
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
            <Link to={`/${tool.id}`} className="tool-link">
              Open Tool
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
} 
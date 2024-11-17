// Main application component that handles routing
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { CompanyLoginHelper } from './pages/CompanyLoginHelper'
import { NotFound } from './pages/NotFound'
import { RobotVerification } from './pages/RobotVerification'
import { JsonProcessor } from './pages/JsonProcessor'
import { Censorship } from './pages/Censorship'
import { AudioProcessor } from './pages/AudioProcessor'
import './App.css'
import { Navigation } from './components/Navigation'
import { OpenAIProvider } from './services/llm/providers/openai'
import { LLMService } from './services/llm/LLMService'
import { ImageAnalyzer } from './pages/ImageAnalyzer'
import { RobotImageGenerator } from './pages/RobotImageGenerator'

function App() {
  const provider = new OpenAIProvider(import.meta.env.VITE_OPENAI_API_KEY);
  const llmService = new LLMService(provider);

  // Set up the router with navigation and routes to different pages
  return (
    <Router>
      <div className="app">
        {/* Navigation component for menu links */}
        <Navigation />
        
        {/* Main content area containing route components */}
        <main className="main-content">
          <Routes>
            {/* Define available routes and their corresponding components */}
            <Route path="/" element={<Home />} />
            <Route path="/company_login_helper" element={<CompanyLoginHelper />} />
            <Route path="/robot_verification" element={<RobotVerification />} />
            <Route path="/json_processor" element={<JsonProcessor />} />
            <Route path="/censorship" element={<Censorship llmService={llmService} />} />
            <Route path="/audio_processor" element={<AudioProcessor llmService={llmService} />} />
            <Route path="/image_analyzer" element={<ImageAnalyzer llmService={llmService} />} />
            <Route path="/robot_image_generator" element={<RobotImageGenerator />} />
            {/* Catch-all route for undefined paths */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

import { Link } from 'react-router-dom'
import '../styles/Navigation.css'

// Navigation component providing the main menu bar
export function Navigation() {
  return (
    <nav className="main-nav">
      {/* Logo/Home link */}
      <Link to="/" className="nav-logo">Training Tools</Link>
      
      {/* Hamburger menu button */}
      <button 
        className="menu-toggle"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Collapsible navigation links */}
      <div className="nav-links">
        <Link to="/company_login_helper">
          Company Login Helper
        </Link>
        <Link to="/robot_verification">
          Robot Verification
        </Link>
        <Link to="/json_processor">
          JSON Processor
        </Link>
        <Link to="/censorship">
          Censorship
        </Link>
        <Link to="/audio_processor">
          Audio Processor
        </Link>
        <Link to="/image_analyzer">
          Image Analyzer
        </Link>
      </div>
    </nav>
  )
} 
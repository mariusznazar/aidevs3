import { Link } from 'react-router-dom'

// 404 error page component shown when accessing undefined routes
export function NotFound() {
  return (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      {/* Link back to home page */}
      <Link to="/">Go Home</Link>
    </div>
  )
} 
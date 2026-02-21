import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <h2 className="logo">AI Interpreter</h2>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/subscription">Subscription</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/login">Login/Register</Link>
        </div>
      </nav>

      {/* Homepage Content */}
      <div className="container">
        <h1>AI Sign Language Interpreter</h1>
        <p>Translate sign language in real-time using your webcam.</p>

        <Link to="/webcam">
          <button>Start Webcam</button>
        </Link>
      </div>
    </div>
  );
}
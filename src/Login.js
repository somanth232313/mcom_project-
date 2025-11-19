import React, { useState } from 'react';
// Import the 'auth' object we exported from firebaseConfig.js
import { auth } from './firebaseConfig';
// Import the Firebase function for email/password login
import { signInWithEmailAndPassword } from 'firebase/auth';
// Import the hook to navigate to other pages
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  // Create state variables to store the email and password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // To store any login errors
  const navigate = useNavigate(); // Get the navigation function

  // This function will run when the user clicks the "Login" button
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent the form from reloading the page
    setError(null); // Clear any previous errors

    try {
      // Try to sign in with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      // If successful, navigate to the dashboard
      navigate('/dashboard');
    } catch (err) {
      // If there's an error, display it
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h1>Admin Login</h1>
        
        {/* Email Input */}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        {/* Password Input */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {/* Show error message if login fails */}
        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;
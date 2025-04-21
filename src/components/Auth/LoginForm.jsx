// src/components/Auth/LoginForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // <-- 1. Import useAuth hook
// Optional: Import your UI components if available
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState(''); // Remove local error state

  // 2. Get values/functions from AuthContext
  const { loginAction, isLoading, authError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Error state is now handled by authError from context
    // setError('');
    console.log('Attempting login via context action:', { email, password });

    // 3. Call the loginAction from the context
    const success = await loginAction(email, password);

    if (success) {
      console.log("Login action reported success (navigation should occur).");
      // No need for alert or local state update, context handles it
      // Clear form if desired, although redirect often happens first
       setEmail('');
       setPassword('');
    } else {
      console.log("Login action reported failure.");
      // Error message is now available in 'authError' from context
    }
  };

  // --- Basic Styling (Replace with your UI library later) ---
  const inputStyle = { border: '1px solid #ccc', padding: '8px', marginBottom: '10px', width: '100%' };
  const buttonStyle = { padding: '10px 20px', cursor: 'pointer', opacity: isLoading ? 0.6 : 1 };
  const errorStyle = { color: 'red', marginTop: '10px'};
  // --- End Styling ---

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '300px', margin: '20px auto', padding: '20px', border: '1px solid #eee' }}>
      <h2>Login</h2>
      {/* 4. Display the global authError */}
      {authError && <p style={errorStyle}>{authError}</p>}
      <div>
        <label htmlFor="login-email">Email:</label><br/>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
          disabled={isLoading} // Disable input during loading
        />
      </div>
      <div>
        <label htmlFor="login-password">Password:</label><br/>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
          disabled={isLoading} // Disable input during loading
        />
      </div>
      {/* 4. Use isLoading state from context */}
      <button type="submit" style={buttonStyle} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default LoginForm;
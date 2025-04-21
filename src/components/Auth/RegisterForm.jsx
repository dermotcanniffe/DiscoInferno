// src/components/Auth/RegisterForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // <-- 1. Import useAuth
import { useNavigate } from 'react-router-dom'; // To potentially redirect

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  // Remove local error/success states, use context/alerts for now
  // const [error, setError] = useState('');
  // const [success, setSuccess] = useState('');

  // 2. Get context values/actions
  const { registerAction, isLoading, authError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Registering via context action:', { email, password, name });

    // 3. Call registerAction from context
    const result = await registerAction(email, password, name);

    if (result?.success) {
      console.log('Registration successful:', result.message);
      alert(result.message || 'Registration successful! Please log in.'); // Use alert for now
      navigate('/login'); // Redirect to login after successful registration
      // Clear form (optional)
       setEmail(''); setPassword(''); setName('');
    } else {
      console.log("Registration action reported failure.");
      // Error message should be available in 'authError' from context
      // No need for local error state, it's displayed below
    }
  };

  // --- Basic Styling (Replace later) ---
  const inputStyle = { border: '1px solid #ccc', padding: '8px', marginBottom: '10px', width: '100%' };
  const buttonStyle = { padding: '10px 20px', cursor: 'pointer', opacity: isLoading ? 0.6 : 1 };
  const errorStyle = { color: 'red', marginTop: '10px'};
  // --- End Styling ---

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '300px', margin: '20px auto', padding: '20px', border: '1px solid #eee' }}>
      <h2>Register</h2>
      {/* 4. Display global authError */}
      {authError && <p style={errorStyle}>{authError}</p>}
      {/* Remove local success message display */}
      <div>
        <label htmlFor="reg-name">Name (Optional):</label><br/>
        <input id="reg-name" type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} disabled={isLoading}/>
      </div>
      <div>
        <label htmlFor="reg-email">Email:</label><br/>
        <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} disabled={isLoading} />
      </div>
      <div>
        <label htmlFor="reg-password">Password:</label><br/>
        <input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} disabled={isLoading} />
      </div>
       {/* 4. Use isLoading state */}
      <button type="submit" style={buttonStyle} disabled={isLoading}>
         {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

export default RegisterForm;
'use client';
import { login, signup, googleAuth, forgotPassword } from './actions';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [bio, setBio] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [isSignup, setIsSignup] = useState(false); 
  const [errorMessage, setErrorMessage] = useState(''); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    setErrorMessage('');
  
    if (isSignup) {
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match!");
        return; 
      }
      if (password.length < 6) {
        setErrorMessage("Password should be at least 6 characters!");
        return; 
      }
  
      const formData = new FormData(e.target as HTMLFormElement);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('name', name); 
      formData.append('bio', bio);   
      formData.append('avatar_url', ''); 
      
      await signup(formData);  
    } else {
      await login(new FormData(e.target as HTMLFormElement)); 
    }
  };
  

  const handleGoogleAuth = async () => {
    try {
      await googleAuth();
    } catch (error) {
      console.error('Google Auth failed:', error);
    }
  };

  const handleForgotPassword = async () => {
    await forgotPassword(email);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <h2 className="text-3xl font-bold text-center mb-6">{isSignup ? 'Sign Up' : 'Log In'}</h2>

      {/* Name Input - only for Signup */}
      {isSignup && (
        <div className="form-group">
          <label htmlFor="name" className="block text-sm font-medium text-gray-400">
            Name:
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-gray-400 focus:border-gray-500"
          />
        </div>
      )}

      {/* Email Input */}
      <div className="form-group">
        <label htmlFor="email" className="block text-sm font-medium text-gray-400">
          Email:
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-gray-400 focus:border-gray-500"
        />
      </div>

      {/* Password Input */}
      <div className="form-group">
        <label htmlFor="password" className="block text-sm font-medium text-gray-400">
          Password:
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-gray-400 focus:border-gray-500"
        />
      </div>

      {/* Confirm Password - only for Signup */}
      {isSignup && (
        <div className="form-group">
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-400">
            Confirm Password:
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-gray-400 focus:border-gray-500"
          />
          
          {/* Error Message for Password Mismatch */}
          {errorMessage && (
            <p className="mt-2 text-sm text-red-500 font-medium">{errorMessage}</p>
          )}
        </div>
      )}

      {/* Login & Signup Buttons */}
      <div className="flex justify-between items-center">
        <button
          type="submit"
          className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition duration-200"
        >
          {isSignup ? 'Sign Up' : 'Log In'}
        </button>
        <button
          type="button"
          onClick={() => setIsSignup(!isSignup)} // Toggle between login and signup
          className="w-full sm:w-auto mt-4 sm:mt-0 sm:ml-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition duration-200"
        >
          {isSignup ? 'Switch to Log In' : 'Switch to Sign Up'}
        </button>
      </div>

      {/* Forgot Password - only show for login */}
      {!isSignup && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-gray-400 hover:text-gray-200 transition duration-200"
          >
            Forgot Password?
          </button>
        </div>
      )}

      {/* Google Authentication */}
      <div className="text-center mt-6">
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="bg-gray-800 hover:bg-red-600 text-white py-2 px-4 rounded-md w-full flex items-center justify-center transition duration-200"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
            alt="Google Logo"
            className="w-5 h-5 mr-2"
          />
          Continue with Google
        </button>
      </div>
    </form>
  );
}

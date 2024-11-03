'use client';
import { login, signup, googleAuth, forgotPassword } from './actions';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { createClient } from '@/utils/supabase/client';
import { Session } from '@supabase/supabase-js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [bio, setBio] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [isSignup, setIsSignup] = useState(false); 
  const [errorMessage, setErrorMessage] = useState(''); 
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState<Session | null>(null); 
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (sessionData?.session) {
        setSession(sessionData.session);
      }
      setLoading(false); // Done loading
    };

    checkSession();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); // Clear session, & redirect after login
    router.push('/');
  };

  if (loading) {
    return <div>Loading...</div>; 
  }

  if (session) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold">You're already logged in</h2>
        <p className="mb-4">Would you like to log out?</p>
        <button
          onClick={handleLogout}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-md transition duration-200"
        >
          Logout
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    console.log('Form Data:', { email, password, name, bio, confirmPassword }); // Debugging output

    if (isSignup) {
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match!");
        return;
      }

      const formData = new FormData(e.currentTarget as HTMLFormElement); // Use e.currentTarget to refer to the form
      await signup(formData);
    } else {
      await login(new FormData(e.currentTarget as HTMLFormElement));
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
    <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-950 p-6 rounded-lg shadow-lg max-w-md mx-auto"> {/* Added onSubmit here */}
      <h2 className="text-3xl font-bold text-center mb-6 text-white">{isSignup ? 'Sign Up' : 'Log In'}</h2>

      {isSignup && (
        <div className="form-group">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name:</label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-500 rounded-md text-white"
          />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email:</label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full p-2 bg-gray-800 border border-gray-500 rounded-md text-white"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password:</label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full p-2 bg-gray-800 border border-gray-500 rounded-md text-white"
        />
      </div>

      {isSignup && (
        <div className="form-group">
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">Confirm Password:</label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full p-2 bg-gray-800 border border-gray-500 rounded-md text-white"
          />
          {errorMessage && <p className="mt-2 text-sm text-red-500 font-medium">{errorMessage}</p>}
        </div>
      )}

      <div className="flex justify-between items-center">
        <button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-md transition duration-200">
          {isSignup ? 'Sign Up' : 'Log In'}
        </button>
        <button
          type="button"
          onClick={() => setIsSignup(!isSignup)}
          className="w-full sm:w-auto mt-4 sm:mt-0 sm:ml-2 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition duration-200"
        >
          {isSignup ? 'Switch to Log In' : 'Switch to Sign Up'}
        </button>
      </div>

      {!isSignup && (
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-gray-400 hover:text-gray-300 transition duration-200"
          >
            Forgot Password?
          </button>
        </div>
      )}

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="bg-gray-700 hover:bg-red-600 text-white py-2 px-4 rounded-md w-full flex items-center justify-center transition duration-200"
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

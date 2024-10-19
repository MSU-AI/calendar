'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

function validateFormData(formData: FormData, requiredFields: string[]) {
  for (const field of requiredFields) {
    if (!formData.get(field)) {
      return false;
    }
  }
  return true;
}

export async function login(formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!validateFormData(formData, ['email', 'password'])) {
    console.error('Missing required fields');
    return redirect('/error');
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Login error:', error.message);
    return redirect('/error'); // Redirect to error page
  }

  // Revalidate the page and redirect to home page after login
  revalidatePath('/');
  return redirect('/');
}

export async function signup(formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string || '';
  const bio = formData.get('bio') as string || '';
  const avatarUrl = formData.get('avatar_url') as string || '';

  // Validate signup input
  if (!email || !password) {
    console.error('Missing signup credentials');
    return redirect('/error');
  }

  // Sign up the user
  const { data: user, error: signUpError } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });
  console.log('Sign-up response:', user);
  if (signUpError) {
    console.error('Sign-up error:', signUpError.message);
  }
  
  if (user?.user?.id) {
    const userId = user.user.id;
    console.log('Proceeding to insert profile for user ID:', userId);

    // Retry mechanism for inserting profile
    await insertProfileWithRetry(supabase, userId, name, bio, avatarUrl);
  } else {
    console.error('User ID is missing from the signup response');
    return redirect('/error');
  }

  // Revalidate the path and redirect after successful signup
  revalidatePath('/');
  return redirect('/');
}

async function insertProfileWithRetry(
  supabase: SupabaseClient<any, "public", any>,
  userId: string,
  name: string,
  bio: string,
  avatarUrl: string,
  retries = 3,
  delayMs = 2000
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { error: profileInsertError } = await supabase
      .from('profiles')
      .insert({
        id: userId, // Use the user's ID from auth.users
        name,
        bio,
        avatar_url: avatarUrl,
      });

    if (!profileInsertError) {
      console.log(`Profile successfully inserted on attempt ${attempt} for user ID:`, userId);
      return;
    }

    console.error(`Profile insert error on attempt ${attempt}:`, profileInsertError.message);

    if (attempt < retries) {
      console.log(`Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs)); // Wait before retrying
    }
  }

  console.error('Profile insert failed after maximum retries.');
  return redirect('/error');
}

export async function googleAuth() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });

  if (error) {
    console.error('Google authentication error:', error.message);
    throw new Error('Google login failed');
  }

  if (data?.url) {
    return redirect(data.url); 
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    console.error('Failed to retrieve user session:', sessionError?.message);
    throw new Error('Session retrieval failed');
  }

  const user = sessionData.session.user; 
  const userId = user.id;
  const email = user.email;
  const name = user.user_metadata?.full_name || ''; // User's full name from Google metadata
  const avatarUrl = user.user_metadata?.avatar_url || ''; // User's avatar URL from Google metadata

  console.log('Google user authenticated:', {
    userId,
    email,
    name,
    avatarUrl,
  });

  const { error: profileInsertError } = await supabase
    .from('profiles')
    .insert({
      id: userId, // Use the user's ID from auth.users
      name: name,  // Name from Google metadata
      bio: '',     // Empty bio for now
      avatar_url: avatarUrl, // Avatar from Google metadata
    });

  if (profileInsertError) {
    console.error('Profile insert error:', profileInsertError.message);
    throw new Error('Failed to insert profile');
  }

  console.log('Profile successfully inserted for user:', userId);
}

export async function forgotPassword(email: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`, // URL to redirect to after the user clicks the reset link
  });

  if (error) {
    console.error('Password reset error:', error.message);
    throw new Error('Failed to send password reset email');
  }

  console.log('Password reset email sent successfully');
}
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';

export async function login(formData: FormData) {
  const supabase = createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error('Login error:', error.message);
    return redirect('/error'); // Error page
  }

  // Revalidate the page if needed
  revalidatePath('/'); // No second argument required
  redirect('/'); // Redirect to home page after login
}

export async function signup(formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string || ''; 
  const bio = formData.get('bio') as string || '';    
  const avatarUrl = formData.get('avatar_url') as string || ''; 

  console.log('Signup process initiated...');
  console.log(`Email: ${email}, Password: ${password}`);

  const { data: user, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Signup error:', signUpError.message);
    return redirect('/error'); // Redirect to an error page
  }

  console.log('Signup successful:', user);

  if (user?.user?.id) {
    console.log('Inserting profile for user ID:', user.user.id);
    const { error: profileInsertError } = await supabase
      .from('profiles')
      .insert({
        id: user.user.id, // Use the user's ID from auth.users
        name: name,
        bio: bio,
        avatar_url: avatarUrl,
      });

    if (profileInsertError) {
      console.error('Profile insert error:', profileInsertError.message);
      return redirect('/error'); // Handle error appropriately
    }

    console.log('Profile successfully inserted for user ID:', user.user.id);
  } else {
    console.error('User ID is missing from the signup response');
    return redirect('/error'); // Redirect to an error page
  }

  // Step 3: Redirect to home page after successful signup and profile creation
  revalidatePath('/');
  redirect('/');
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
  if (data?.url){
    redirect(data.url);
  }

  console.log('Google auth data:', data);
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

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        console.log('Session Data:', sessionData); // Log the session data

        if (sessionError || !sessionData.session) {
          console.error('Failed to retrieve session:', sessionError?.message);
          // Add a delay before redirecting to the error page
          setTimeout(() => {
            router.push('/error');
          }, 2000); // Delay for 2 seconds
          return;
        }

        const user = sessionData.session.user;
        const userId = user.id;
        const name = user.user_metadata?.full_name || ''; // Full name from Google
        const avatarUrl = user.user_metadata?.avatar_url || ''; // Avatar URL from Google

        console.log('Inserting profile with data:', {
          id: userId,
          name,
          bio: '',
          avatar_url: avatarUrl,
        }); // Log data being inserted

        const { error: profileInsertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            name,
            bio: '',
            avatar_url: avatarUrl,
          });

        if (profileInsertError) {
          console.error('Profile insert error:', profileInsertError.message);
          // Add a delay before redirecting to the error page
          setTimeout(() => {
            router.push('/error');
          }, 2000); // Delay for 2 seconds
          return;
        }

        console.log('Profile successfully inserted for user:', userId);
        router.push('/'); 
      } catch (err) {
        console.error('Error during OAuth callback:', err);
        // Add a delay before redirecting to the error page
        setTimeout(() => {
          router.push('/error');
        }, 2000); // Delay for 2 seconds
      }
    };

    handleOAuthCallback(); 
  }, [router, supabase]);

  return <div>Authenticating...</div>;
}

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

        if (sessionError || !sessionData.session) {
          console.error('Failed to retrieve session:', sessionError?.message);
          router.push('/error');
          return;
        }

        const user = sessionData.session.user;
        const userId = user.id;
        const name = user.user_metadata?.full_name || ''; // Full name from Google
        const avatarUrl = user.user_metadata?.avatar_url || ''; // Avatar URL from Google

        const { error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name,
            bio: '',
            avatar_url: avatarUrl,
          });

        if (profileInsertError) {
          console.error('Profile insert error:', profileInsertError.message);
          router.push('/error');
          return;
        }

        console.log('Profile successfully inserted for user:', userId);
        router.push('/'); 
      } catch (err) {
        console.error('Error during OAuth callback:', err);
        router.push('/error');
      }
    };

    handleOAuthCallback(); 
  }, [router, supabase]);

  return <div>Authenticating...</div>;
}

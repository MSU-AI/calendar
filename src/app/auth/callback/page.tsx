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
          // console.error('Failed to retrieve session:', sessionError?.message);
          return router.push('/error');
        }

        const user = sessionData.session.user;
        const userId = user.id;
        const name = user.user_metadata?.full_name || '';
        const avatarUrl = user.user_metadata?.avatar_url || '';

        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (profileCheckError) {
          // console.error('Profile check error:', profileCheckError.message);
          return router.push('/error');
        }

        if (!existingProfile) {
          const { error: profileInsertError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              name,
              bio: '',
              avatar_url: avatarUrl,
            });

          if (profileInsertError) {
            // console.error('Profile insert error:', profileInsertError.message);
            return router.push('/error');
          }
        }

        // console.log('Profile successfully handled for user:', userId);
        router.push('/');
      } catch (err) {
        // console.error('Error during OAuth callback:', err);
        router.push('/error');
      }
    };

    handleOAuthCallback();
  }, [router, supabase]);

  return <div>Authenticating...</div>;
}

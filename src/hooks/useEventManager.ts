import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

const useEventManager = () => {
  const supabase = createClient();
  const [events, setEvents] = useState<any[]>([]);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const savedEvents = JSON.parse(localStorage.getItem('events') || '[]');
    setEvents(savedEvents);
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session || null);
    };
    fetchSession();
  }, [supabase]);

  const saveEvents = (updatedEvents: any[]) => {
    setEvents(updatedEvents);
    localStorage.setItem('events', JSON.stringify(updatedEvents));
  };

  const syncEventsWithBackend = async () => {
    if (!session) return; 
  
    const unsyncedEvents = JSON.parse(localStorage.getItem('events') || '[]');
    if (unsyncedEvents.length > 0) {
      try {
        await supabase.from('task_log').insert(unsyncedEvents);
        localStorage.removeItem('events');
      } catch (error) {
        console.error('Error syncing events:', error);
      }
    }
  };
  
  useEffect(() => {
    const syncInterval = setInterval(syncEventsWithBackend, 60000); // every minute
    return () => clearInterval(syncInterval);
  }, [session]);

  return { events, saveEvents, syncEventsWithBackend };
};

export default useEventManager;

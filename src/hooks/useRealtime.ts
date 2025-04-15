
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

// Define a type for the callback function that matches what Supabase actually sends
export const useRealtime = (
  table: string,
  event: RealtimeEvent,
  callback: (payload: any) => void
) => {
  useEffect(() => {
    // Create a channel specifically for this table and event
    const channelId = `${table}-${event}-changes`;
    
    // Create and subscribe to the channel with the correct configuration
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes', 
        { 
          event: event, 
          schema: 'public', 
          table: table 
        }, 
        (payload) => {
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${table}: ${status}`);
      });

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, callback]);
};


import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export const useRealtime = (
  table: string,
  event: RealtimeEvent,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) => {
  useEffect(() => {
    // Create a channel specifically for this table and event
    const channelId = `${table}-${event}-changes`;
    
    // Create a channel with the correct configuration for Supabase JS v2
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes', 
        {
          event: event,
          schema: 'public',
          table: table
        },
        callback
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


import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const useRealtime = (
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE',
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) => {
  useEffect(() => {
    // Create a channel with a specific name for database changes
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes', 
        {
          event: event,
          schema: 'public',
          table: table
        },
        callback
      )
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, callback]);
};

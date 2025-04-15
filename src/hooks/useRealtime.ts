
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const useRealtime = (
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE',
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) => {
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes', // This is the event source - not the event type
        {
          event,
          schema: 'public',
          table,
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, callback]);
};


import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtime = (
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE',
  callback: (payload: any) => void
) => {
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
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

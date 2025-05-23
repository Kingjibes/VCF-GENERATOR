import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useContactManager = (setSessionsGlobal) => {
  const { toast } = useToast();

  const addContactToSession = useCallback(async (sessionId, contact) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('expires_at, contacts (name)')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        toast({ title: "Error", description: "Session not found or could not be verified.", variant: "destructive" });
        return null;
      }

      if (new Date(sessionData.expires_at) < new Date()) {
        toast({ title: "Session Expired", description: "Cannot add contact, session has expired.", variant: "destructive" });
        return null;
      }

      const existingNames = (sessionData.contacts || []).map(c => c.name.toLowerCase());
      if (existingNames.includes(contact.name.toLowerCase())) {
        toast({ title: "Duplicate Name", description: "This name has already been submitted for this session.", variant: "destructive" });
        return null;
      }
      
      const { data, error } = await supabase
        .from('contacts')
        .insert([{ session_id: sessionId, name: contact.name, phone: contact.phone, email: contact.email || null }])
        .select()
        .single();

      if (error) throw error;
      
      if (setSessionsGlobal) {
        setSessionsGlobal(prevSessions =>
          prevSessions.map(s =>
            s.id === sessionId
              ? { ...s, contacts: [...(s.contacts || []), data], contactCount: (s.contactCount || 0) + 1 } 
              : s
          )
        );
      }
      return data;
    } catch (error) {
      console.error("Error adding contact:", error);
      toast({ title: "Error", description: "Could not add contact.", variant: "destructive" });
      return null;
    }
  }, [toast, setSessionsGlobal]);

  return { addContactToSession };
};

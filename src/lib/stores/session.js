import { writable } from 'svelte/store';
import { supabase } from '../supabaseClient.js';

// undefined = still loading initial session, null = signed out, object = signed in
export const session = writable(undefined);

supabase.auth.getSession().then(({ data }) => {
  session.set(data.session);
});

supabase.auth.onAuthStateChange((_event, newSession) => {
  session.set(newSession);
});

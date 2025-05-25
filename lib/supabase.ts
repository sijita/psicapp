import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Credenciales de Supabase
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'tu-clave-anonima-de-supabase';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Funciones de autenticación
export const signUp = async (
  email: string,
  password: string,
  nombre?: string,
  apellido?: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) return { data, error };

  // Si el registro fue exitoso, guardar nombre y apellido en la tabla profiles
  if (data.user && nombre && apellido) {
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      username: email,
      full_name: `${nombre} ${apellido}`,
    });
    if (profileError) return { data, error: profileError };
  }
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
};

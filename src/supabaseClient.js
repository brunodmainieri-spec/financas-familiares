import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as chaves são válidas ou se devemos rodar em modo MOCK local
export const isMockEnabled = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('your-supabase-project') ||
  supabaseUrl === '';

export const supabase = isMockEnabled 
  ? null 
  : createClient(supabaseUrl, supabaseAnonKey);

if (isMockEnabled) {
  console.log('⚠️ Supabase executando em modo MOCK local (dados salvos no LocalStorage).');
} else {
  console.log('✅ Supabase conectado com sucesso.');
}

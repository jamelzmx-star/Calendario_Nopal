import { createClient } from '@supabase/supabase-js'

const URL  = import.meta.env.VITE_SUPABASE_URL  || ''
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const SUPABASE_LISTO = URL.startsWith('https://') && ANON.length > 20

export const supabase = SUPABASE_LISTO
  ? createClient(URL, ANON)
  : null
import { createClient } from './supabase/server'

const DEFAULT_CURRENCY = 'CRC'

// Server-only function to fetch currency from settings
export async function getAppCurrency(): Promise<string> {
 try {
     const supabase = await createClient()
     const { data } = await supabase
       .from('settings')
       .select('currency')
       .single()
     return data?.currency || DEFAULT_CURRENCY
   } catch {
     return DEFAULT_CURRENCY
   }
  return DEFAULT_CURRENCY
}

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

// Server-side only — uses the service role key, never expose to the browser.
// Used for user management operations (list, invite, ban) that require admin privileges.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  )
}

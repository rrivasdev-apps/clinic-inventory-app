import { createClient } from '@/lib/supabase/server'

export async function getActiveAlertsCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('alerts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching active alerts count:', error)
    return 0
  }

  return count ?? 0
}

import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import { env } from './env'

export type ConnectionStatus = 'online' | 'offline' | 'backend-issue' | 'syncing' | 'checking'

const STATUS_EVENT = 'articlex-connection-changed'
let _status: ConnectionStatus = 'checking'

export function getConnectionStatus(): ConnectionStatus {
  return _status
}

function setStatus(next: ConnectionStatus) {
  if (_status === next) return
  _status = next
  window.dispatchEvent(new CustomEvent(STATUS_EVENT, { detail: next }))
}

export async function checkSupabaseHealth(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  try {
    const res = await fetch(`${env.supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': env.supabaseAnonKey!,
      },
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function checkSupabaseTableAccess(): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  try {
    const { error } = await supabase.from('collections').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

let _interval: ReturnType<typeof setInterval> | null = null

export function startConnectionMonitor() {
  const poll = async () => {
    if (!navigator.onLine) {
      setStatus('offline')
      return
    }

    if (!isSupabaseConfigured()) {
      setStatus('online')
      return
    }

    const serverUp = await checkSupabaseHealth()
    if (!serverUp) {
      setStatus(navigator.onLine ? 'backend-issue' : 'offline')
      return
    }

    const tablesOk = await checkSupabaseTableAccess()
    if (!tablesOk) {
      setStatus('backend-issue')
      return
    }

    setStatus('online')
  }

  void poll()
  _interval = setInterval(() => void poll(), 30_000)

  window.addEventListener('online', () => void poll())
  window.addEventListener('offline', () => setStatus('offline'))
}

export function stopConnectionMonitor() {
  if (_interval) { clearInterval(_interval); _interval = null }
}

export function onConnectionChange(fn: (status: ConnectionStatus) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent).detail as ConnectionStatus)
  window.addEventListener(STATUS_EVENT, handler)
  return () => window.removeEventListener(STATUS_EVENT, handler)
}

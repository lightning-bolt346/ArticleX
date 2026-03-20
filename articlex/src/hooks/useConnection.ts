import { useEffect, useState } from 'react'
import {
  getConnectionStatus,
  onConnectionChange,
  type ConnectionStatus,
} from '../lib/connection'

export function useConnection() {
  const [status, setStatus] = useState<ConnectionStatus>(getConnectionStatus)

  useEffect(() => {
    return onConnectionChange(setStatus)
  }, [])

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isSyncing: status === 'syncing',
  }
}

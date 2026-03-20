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
    isBackendIssue: status === 'backend-issue',
    isSyncing: status === 'syncing',
    isHealthy: status === 'online',
    hasIssue: status === 'offline' || status === 'backend-issue',
  }
}

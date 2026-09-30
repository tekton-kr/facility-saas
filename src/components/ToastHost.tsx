import { useEffect, useState } from 'react'
import { subscribeToast } from '../lib/toast.ts'

export function ToastHost() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    let timer = 0
    const stop = subscribeToast((next) => {
      setMessage(next)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setMessage(''), 2800)
    })
    return () => {
      window.clearTimeout(timer)
      stop()
    }
  }, [])

  if (!message) return null

  return (
    <div className="toast" role="status">
      {message}
    </div>
  )
}

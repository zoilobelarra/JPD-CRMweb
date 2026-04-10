import { useState, useEffect, useCallback } from 'react'

let toastIdCounter = 0
let globalAddToast = null

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  useEffect(() => {
    globalAddToast = addToast
  }, [addToast])

  return { toasts, addToast }
}

export function toast(message, type = 'success') {
  if (globalAddToast) globalAddToast(message, type)
}

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? '✓' : '✗'} {t.message}
        </div>
      ))}
    </div>
  )
}

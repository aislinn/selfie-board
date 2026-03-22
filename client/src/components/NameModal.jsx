import { useState, useEffect } from 'react'

/**
 * Props:
 *   initial    – prefill value
 *   onConfirm(name) – called with the entered name
 *   onSkip()        – called if user dismisses without a name
 */
export default function NameModal({ initial = '', onConfirm, onSkip }) {
  const [value, setValue] = useState(initial)
  const [visible, setVisible] = useState(false)

  // Trigger enter animation on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  function dismiss(cb) {
    setVisible(false)
    setTimeout(cb, 220)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) dismiss(() => onConfirm(trimmed))
    else dismiss(() => onSkip?.())
  }

  function handleBackdrop() {
    dismiss(() => onSkip?.())
  }

  const backdropStyle = {
    background: 'rgba(10, 13, 22, 0.85)',
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.2s ease',
  }

  const sheetStyle = {
    background: '#1A1F2B',
    borderRadius: 24,
    padding: '28px 24px 24px',
    boxShadow: '0 -4px 60px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.08)',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
    transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:items-center sm:pt-0 p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm" style={backdropStyle} onPointerDown={handleBackdrop} />

      {/* Sheet */}
      <div className="relative w-full max-w-sm flex flex-col gap-5" style={sheetStyle}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 400, margin: 0, letterSpacing: '-0.3px' }}>
            What's your name?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '4px 0 0' }}>
            It'll appear on your selfie cards
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            style={{
              width: '100%',
              height: 44,
              padding: '0 16px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.07)',
              color: '#fff',
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              height: 44,
              padding: '0 16px',
              borderRadius: 14,
              border: 'none',
              background: value.trim() ? '#fff' : 'rgba(255,255,255,0.1)',
              color: value.trim() ? '#111' : 'rgba(255,255,255,0.4)',
              fontSize: 15,
              fontWeight: 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              letterSpacing: '-0.2px',
            }}
          >
            {value.trim() ? 'Continue' : 'Skip'}
          </button>
        </form>
      </div>
    </div>
  )
}

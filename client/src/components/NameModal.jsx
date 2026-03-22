import { useState } from 'react'

/**
 * Props:
 *   initial    – prefill value
 *   onConfirm(name) – called with the entered name
 *   onSkip()        – called if user dismisses without a name
 */
export default function NameModal({ initial = '', onConfirm, onSkip }) {
  const [value, setValue] = useState(initial)

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onConfirm(trimmed)
    else onSkip?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div className="relative w-full max-w-sm flex flex-col gap-5" style={{
        background: '#1c2030',
        borderRadius: 24,
        padding: '28px 24px 24px',
        boxShadow: '0 -4px 60px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: '-0.3px' }}>
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
              padding: '14px 16px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.07)',
              color: '#fff',
              fontSize: 16,
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
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              background: value.trim() ? '#fff' : 'rgba(255,255,255,0.1)',
              color: value.trim() ? '#111' : 'rgba(255,255,255,0.4)',
              fontSize: 15,
              fontWeight: 600,
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

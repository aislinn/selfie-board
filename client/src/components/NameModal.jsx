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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col gap-4">
        <div className="text-center">
          <div className="text-3xl mb-2">👤</div>
          <h2 className="text-lg font-semibold text-gray-900">What's your name?</h2>
          <p className="text-sm text-gray-400 mt-1">It'll appear on your selfie cards</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors"
            maxLength={40}
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-700 active:scale-95 transition-all"
          >
            {value.trim() ? 'Save' : 'Skip'}
          </button>
        </form>
      </div>
    </div>
  )
}

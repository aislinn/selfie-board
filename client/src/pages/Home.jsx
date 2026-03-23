import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const navigate = useNavigate()

  function createBoard() {
    const roomId = uuidv4().slice(0, 8)
    navigate(`/board/${roomId}`)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: '#1A1F2B' }}
    >
      {/* Logo / hero */}
      <div className="text-center space-y-4 mb-6" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <h1 className="text-5xl font-light tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>Selfie Board</h1>
        <p className="text-base mx-auto leading-relaxed" style={{ maxWidth: 480, color: 'rgba(255,255,255,0.45)' }}>
          A shared canvas where anyone with the link can snap selfies and pin them as polaroid cards — in real time.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={createBoard}
        className="px-8 py-3 text-base font-semibold rounded-full active:scale-95 transition-all cursor-pointer"
        style={{
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          background: 'rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.9)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
      >
        Create a board
      </button>

    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const navigate = useNavigate()

  function createBoard() {
    const roomId = uuidv4().slice(0, 8)
    navigate(`/board/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-pink-50 flex flex-col items-center justify-center gap-8 p-6">
      {/* Logo / hero */}
      <div className="text-center space-y-3">
        <div className="text-6xl">📸</div>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">Selfie Board</h1>
        <p className="text-lg text-gray-500 max-w-sm">
          A shared canvas where anyone with the link can snap selfies and pin them as polaroid cards — in real time.
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={createBoard}
        className="px-8 py-4 bg-gray-900 text-white text-lg font-semibold rounded-2xl shadow-lg hover:bg-gray-700 active:scale-95 transition-all"
      >
        Create a board →
      </button>

      {/* Features list */}
      <ul className="text-sm text-gray-400 space-y-1 text-center">
        <li>📷  Snap with your front or rear camera</li>
        <li>🖼  Drag and rearrange polaroid cards</li>
        <li>🌍  Share the URL — anyone can join instantly</li>
      </ul>
    </div>
  )
}

import { useCallback, useRef } from 'react'
import PhotoCard from './PhotoCard'
import RemoteCursors from './RemoteCursors'

// Throttle helper (manual — avoids lodash dependency)
function throttle(fn, ms) {
  let last = 0
  return (...args) => {
    const now = Date.now()
    if (now - last >= ms) {
      last = now
      fn(...args)
    }
  }
}

/**
 * Props:
 *   cards         – Map<id, card>
 *   remoteCursors – Map<clientId, { x, y, name }>
 *   onCardDragEnd – (id, x, y)
 *   onCardFocus   – (id)
 *   onCursorMove  – (x, y)  — throttled, called on pointermove
 */
export default function BoardCanvas({ cards, remoteCursors, onCardDragEnd, onCardFocus, onCursorMove }) {
  const canvasRef = useRef(null)

  // Throttled cursor emit (~30fps)
  const throttledCursorMove = useRef(
    throttle((x, y) => onCursorMove?.(x, y), 33)
  ).current

  function handlePointerMove(e) {
    throttledCursorMove(e.clientX, e.clientY)
  }

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '28px 28px', backgroundColor: '#f9fafb' }}
      onPointerMove={handlePointerMove}
    >
      {/* Cards */}
      {[...cards.values()].map(card => (
        <PhotoCard
          key={card.id}
          card={card}
          onDragEnd={onCardDragEnd}
          onFocus={onCardFocus}
        />
      ))}

      {/* Remote cursors */}
      <RemoteCursors cursors={remoteCursors} />
    </div>
  )
}

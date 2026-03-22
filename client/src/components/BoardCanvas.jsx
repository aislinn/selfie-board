import { useRef } from 'react'
import PhotoCard from './PhotoCard'
import RemoteCursors from './RemoteCursors'

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
 *   userName      – current user's name
 *   onCardDragEnd – (id, x, y)
 *   onCardFocus   – (id)
 *   onCardDelete  – (id)
 *   onCursorMove  – (x, y) in canvas-space
 *   panRef        – optional ref; receives { x, y } on every pan update
 */
export default function BoardCanvas({
  cards, remoteCursors, userName,
  onCardDragEnd, onCardFocus, onCardDelete, onCursorMove,
  panRef,
}) {
  const innerRef = useRef(null)
  const panState = useRef(null)  // tracks active pan gesture
  const currentPan = useRef({ x: 0, y: 0 })

  const throttledCursorMove = useRef(
    throttle((x, y) => onCursorMove?.(x, y), 33)
  ).current

  function handlePointerDown(e) {
    panState.current = {
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      originPanX: currentPan.current.x,
      originPanY: currentPan.current.y,
    }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignore */ }
  }

  function handlePointerMove(e) {
    const ps = panState.current
    if (ps) {
      const newX = ps.originPanX + (e.clientX - ps.startPointerX)
      const newY = ps.originPanY + (e.clientY - ps.startPointerY)
      currentPan.current = { x: newX, y: newY }
      if (panRef) panRef.current = { x: newX, y: newY }
      if (innerRef.current) {
        innerRef.current.style.transform = `translate(${newX}px, ${newY}px)`
      }
    }
    // Emit cursor in canvas-space so it aligns with cards on all clients
    const pan = currentPan.current
    throttledCursorMove(e.clientX - pan.x, e.clientY - pan.y)
  }

  function handlePointerUp() {
    panState.current = null
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full overflow-hidden"
      style={{
        background: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        backgroundColor: '#f9fafb',
        touchAction: 'none',
        cursor: 'grab',
      }}
    >
      {/* Inner layer — all cards and cursors live here, panned via transform */}
      <div
        ref={innerRef}
        style={{ position: 'absolute', inset: 0, willChange: 'transform', touchAction: 'none' }}
      >
        {[...cards.values()].map(card => (
          <PhotoCard
            key={card.id}
            card={card}
            isOwn={!!userName && card.name === userName}
            onDragEnd={onCardDragEnd}
            onFocus={onCardFocus}
            onDelete={onCardDelete}
          />
        ))}
        <RemoteCursors cursors={remoteCursors} />
      </div>
    </div>
  )
}

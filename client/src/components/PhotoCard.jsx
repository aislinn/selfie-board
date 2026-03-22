import { useRef, useCallback } from 'react'

/**
 * A draggable polaroid-style card.
 *
 * Props:
 *   card        – { id, image_url, x, y, rotation, name, created_at, zIndex }
 *   onDragEnd   – (id, x, y) called when drag completes
 *   onFocus     – (id) called when card is tapped/clicked
 */
export default function PhotoCard({ card, onDragEnd, onFocus }) {
  const { id, image_url, x, y, rotation, name, created_at, zIndex } = card
  const dragState = useRef(null)

  const formattedDate = new Date(created_at).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const handlePointerDown = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    onFocus(id)
    dragState.current = {
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startCardX: x,
      startCardY: y,
      moved: false,
    }
  }, [id, x, y, onFocus])

  const handlePointerMove = useCallback((e) => {
    const ds = dragState.current
    if (!ds) return
    const dx = e.clientX - ds.startPointerX
    const dy = e.clientY - ds.startPointerY
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) ds.moved = true
    // Live-move by directly updating DOM for smoothness (avoids re-render on every frame)
    const el = e.currentTarget
    el.style.left = `${ds.startCardX + dx}px`
    el.style.top = `${ds.startCardY + dy}px`
  }, [])

  const handlePointerUp = useCallback((e) => {
    const ds = dragState.current
    if (!ds) return
    dragState.current = null
    if (ds.moved) {
      const dx = e.clientX - ds.startPointerX
      const dy = e.clientY - ds.startPointerY
      onDragEnd(id, ds.startCardX + dx, ds.startCardY + dy)
    }
  }, [id, onDragEnd])

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute select-none cursor-grab active:cursor-grabbing"
      style={{
        left: x,
        top: y,
        zIndex,
        transform: `rotate(${rotation}deg)`,
        touchAction: 'none',
        willChange: 'transform',
      }}
    >
      {/* Polaroid frame */}
      <div className="bg-white shadow-xl rounded-sm" style={{ padding: '8px 8px 32px 8px', width: 180 }}>
        <img
          src={image_url}
          alt={name ?? 'selfie'}
          draggable={false}
          className="block w-full aspect-[3/4] object-cover rounded-sm"
        />
        {/* Caption area */}
        <div className="pt-2 space-y-0.5">
          {name && (
            <p className="text-center text-gray-800 font-medium text-xs truncate leading-tight">
              {name}
            </p>
          )}
          <p className="text-center text-gray-400 text-[10px] leading-tight">{formattedDate}</p>
        </div>
      </div>
    </div>
  )
}

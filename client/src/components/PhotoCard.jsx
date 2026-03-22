import { useRef, useCallback } from 'react'

/**
 * Props:
 *   card        – { id, image_url, x, y, rotation, name, created_at, zIndex }
 *   isOwn       – true if this card was added by the current user
 *   onDragEnd   – (id, x, y) called when drag completes
 *   onFocus     – (id) called when card is tapped/clicked
 *   onDelete    – (id) called when user taps the × button
 */
export default function PhotoCard({ card, isOwn, onDragEnd, onFocus, onDelete, zoomRef, isPinchingRef }) {
  const { id, image_url, x, y, rotation, name, created_at, zIndex } = card
  const dragState = useRef(null)

  const formattedDate = new Date(created_at).toLocaleString(undefined, {
    month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation()
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
    if (isPinchingRef?.current) return  // freeze card during pinch
    const dxScreen = e.clientX - ds.startPointerX
    const dyScreen = e.clientY - ds.startPointerY
    if (Math.abs(dxScreen) > 2 || Math.abs(dyScreen) > 2) ds.moved = true
    const zoom = zoomRef?.current ?? 1
    const el = e.currentTarget
    el.style.left = `${ds.startCardX + dxScreen / zoom}px`
    el.style.top = `${ds.startCardY + dyScreen / zoom}px`
  }, [zoomRef])

  const handlePointerUp = useCallback((e) => {
    const ds = dragState.current
    if (!ds) return
    dragState.current = null
    if (ds.moved) {
      const zoom = zoomRef?.current ?? 1
      const dx = (e.clientX - ds.startPointerX) / zoom
      const dy = (e.clientY - ds.startPointerY) / zoom
      onDragEnd(id, ds.startCardX + dx, ds.startCardY + dy)
    }
  }, [id, onDragEnd, zoomRef])

  function handleDelete(e) {
    e.stopPropagation()
    onDelete(id)
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute select-none cursor-grab active:cursor-grabbing group"
      style={{
        left: x,
        top: y,
        zIndex,
        transform: `rotate(${rotation}deg)`,
        touchAction: 'none',
        willChange: 'transform',
      }}
    >
      {/* Delete button — only visible on own cards */}
      {isOwn && (
        <button
          onPointerDown={handleDelete}
          className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-gray-900 text-white text-sm flex items-center justify-center shadow-md
                     opacity-0 group-hover:opacity-100 focus:opacity-100
                     active:scale-90 transition-all"
          style={{ touchAction: 'none', lineHeight: 1 }}
          title="Remove photo"
          aria-label="Remove photo"
        >
          ×
        </button>
      )}

      {/* Polaroid card */}
      <div
        style={{
          background: 'white',
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 17px,
              rgba(0,0,0,0.018) 17px,
              rgba(0,0,0,0.018) 18px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 28px,
              rgba(0,0,0,0.018) 28px,
              rgba(0,0,0,0.018) 29px
            )
          `,
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          boxShadow: '0px 1px 14px 0px rgba(0,0,0,0.10)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: 220,
        }}
      >
        {/* Square photo with inset shadow */}
        <div
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={image_url}
            alt={name ?? 'selfie'}
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow: 'inset 0px 0px 4px 2px rgba(0,0,0,0.15)',
            }}
          />
        </div>

        {/* Caption */}
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            color: '#1e1e1e',
            textAlign: 'center',
            paddingBottom: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <div style={{ fontSize: 26, lineHeight: 'normal', fontWeight: 400 }}>
            {name || 'Anonymous'}
          </div>
          <div style={{ fontSize: 16, lineHeight: 1 }}>
            {formattedDate}
          </div>
        </div>
      </div>
    </div>
  )
}

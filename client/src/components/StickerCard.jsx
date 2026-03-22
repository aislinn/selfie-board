import { useRef, useCallback } from 'react'

const isTouchDevice = window.matchMedia('(hover: none)').matches

export default function StickerCard({ sticker, onDragEnd, onDelete, zoomRef, isPinchingRef }) {
  const { id, emoji, x, y, rotation } = sticker
  const dragState = useRef(null)

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragState.current = {
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startCardX: x,
      startCardY: y,
      moved: false,
    }
  }, [x, y])

  const handlePointerMove = useCallback((e) => {
    const ds = dragState.current
    if (!ds) return
    if (isPinchingRef?.current) return
    const dxScreen = e.clientX - ds.startPointerX
    const dyScreen = e.clientY - ds.startPointerY
    if (Math.abs(dxScreen) > 2 || Math.abs(dyScreen) > 2) ds.moved = true
    const zoom = zoomRef?.current ?? 1
    const el = e.currentTarget
    el.style.left = `${ds.startCardX + dxScreen / zoom}px`
    el.style.top = `${ds.startCardY + dyScreen / zoom}px`
  }, [zoomRef, isPinchingRef])

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

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute select-none cursor-grab active:cursor-grabbing group"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        touchAction: 'none',
        zIndex: 1000,
      }}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <span style={{ fontSize: 52, lineHeight: 1, display: 'block' }}>{emoji}</span>
        <button
          onPointerDown={(e) => { e.stopPropagation(); onDelete(id) }}
          className={`absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center shadow active:scale-90 transition-all
                     ${isTouchDevice ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          style={{ touchAction: 'none', fontSize: 12, lineHeight: 1 }}
          title="Remove sticker"
          aria-label="Remove sticker"
        >
          ×
        </button>
      </div>
    </div>
  )
}

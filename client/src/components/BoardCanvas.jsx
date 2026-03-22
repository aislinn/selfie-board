import { useRef, useEffect } from 'react'
import PhotoCard from './PhotoCard'
import RemoteCursors from './RemoteCursors'

function throttle(fn, ms) {
  let last = 0
  return (...args) => {
    const now = Date.now()
    if (now - last >= ms) { last = now; fn(...args) }
  }
}

const MIN_ZOOM = 0.25
const MAX_ZOOM = 4
const CANVAS_SIZE = 5000  // fixed canvas square in px

/**
 * Props:
 *   cards         – Map<id, card>
 *   remoteCursors – Map<clientId, { x, y, name }>
 *   userName      – current user's name
 *   onCardDragEnd – (id, x, y)
 *   onCardFocus   – (id)
 *   onCardDelete  – (id)
 *   onCursorMove  – (x, y) in canvas-space
 *   panRef        – optional ref; receives { x, y, zoom } on every transform update
 */
export default function BoardCanvas({
  cards, remoteCursors, userName,
  onCardDragEnd, onCardFocus, onCardDelete, onCursorMove,
  panRef,
}) {
  const outerRef = useRef(null)
  const innerRef = useRef(null)
  const activePointers = useRef(new Map())  // pointerId → { x, y }
  const panState = useRef(null)
  const currentPan = useRef({ x: 0, y: 0 })
  const currentZoom = useRef(1)
  const zoomRef = useRef(1)  // shared with PhotoCard so card drag scales correctly
  const isPinchingRef = useRef(false)  // shared with PhotoCard to block card drag during pinch

  // Centre the canvas on first render
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    applyTransform((el.clientWidth - CANVAS_SIZE) / 2, (el.clientHeight - CANVAS_SIZE) / 2, 1)
  }, [])

  // Track total active pointers on the page (including those captured by cards)
  useEffect(() => {
    let count = 0
    const onDown = () => { count++; if (count >= 2) isPinchingRef.current = true }
    const onUp   = () => { count = Math.max(0, count - 1); if (count < 2) isPinchingRef.current = false }
    // capture:true so stopPropagation in child elements doesn't block our counter
    document.addEventListener('pointerdown',   onDown, { capture: true })
    document.addEventListener('pointerup',     onUp,   { capture: true })
    document.addEventListener('pointercancel', onUp,   { capture: true })
    return () => {
      document.removeEventListener('pointerdown',   onDown, { capture: true })
      document.removeEventListener('pointerup',     onUp,   { capture: true })
      document.removeEventListener('pointercancel', onUp,   { capture: true })
    }
  }, [])

  // Trackpad pinch-to-zoom via wheel events (passive:false required for preventDefault)
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        // Trackpad pinch or Ctrl+scroll → zoom
        const factor = Math.pow(1.01, -e.deltaY)
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom.current * factor))
        const f = newZoom / currentZoom.current
        const { x: px, y: py } = currentPan.current
        applyTransform(px * f + e.clientX * (1 - f), py * f + e.clientY * (1 - f), newZoom)
      } else {
        // Two-finger trackpad scroll → pan
        const { x: px, y: py } = currentPan.current
        applyTransform(px - e.deltaX, py - e.deltaY, currentZoom.current)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel, { passive: false })
  }, [])

  const throttledCursorMove = useRef(
    throttle((x, y) => onCursorMove?.(x, y), 33)
  ).current

  function applyTransform(rawX, rawY, z) {
    // Clamp pan so the canvas is always at least 80px visible on each side
    const el = outerRef.current
    const vw = el ? el.clientWidth  : 800
    const vh = el ? el.clientHeight : 600
    const cs = CANVAS_SIZE * z
    // Canvas must always cover the full viewport — no peeking behind it
    const x = Math.max(vw - cs, Math.min(0, rawX))
    const y = Math.max(vh - cs, Math.min(0, rawY))

    currentPan.current = { x, y }
    currentZoom.current = z
    zoomRef.current = z
    if (panRef) panRef.current = { x, y, zoom: z }
    if (innerRef.current) {
      innerRef.current.style.transform = `translate(${x}px, ${y}px) scale(${z})`
    }
  }

  function handlePointerDown(e) {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (activePointers.current.size === 1) {
      panState.current = {
        startPointerX: e.clientX,
        startPointerY: e.clientY,
        originPanX: currentPan.current.x,
        originPanY: currentPan.current.y,
      }
    } else {
      panState.current = null  // second finger down — switch to pinch mode
    }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
  }

  function handlePointerMove(e) {
    const ptrs = activePointers.current

    if (ptrs.size >= 2) {
      // ── Pinch-to-zoom ────────────────────────────────────────────────────
      const prevPos = ptrs.get(e.pointerId)
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })

      let otherPos = null
      for (const [id, pos] of ptrs) {
        if (id !== e.pointerId) { otherPos = pos; break }
      }

      if (prevPos && otherPos) {
        const prevDist = Math.hypot(prevPos.x - otherPos.x, prevPos.y - otherPos.y)
        const curDist  = Math.hypot(e.clientX - otherPos.x, e.clientY - otherPos.y)

        const prevMidX = (prevPos.x + otherPos.x) / 2
        const prevMidY = (prevPos.y + otherPos.y) / 2
        const curMidX  = (e.clientX + otherPos.x) / 2
        const curMidY  = (e.clientY + otherPos.y) / 2

        const rawFactor = prevDist > 1 ? curDist / prevDist : 1
        const newZoom   = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom.current * rawFactor))
        const factor    = newZoom / currentZoom.current  // actual (clamped) factor

        // Zoom around prevMid, then translate to curMid
        // newPan = prevMid * (1 - factor) + pan * factor + (curMid - prevMid)
        //        = pan * factor + curMid - prevMid * factor
        const { x: px, y: py } = currentPan.current
        applyTransform(
          px * factor + curMidX - prevMidX * factor,
          py * factor + curMidY - prevMidY * factor,
          newZoom,
        )
      }
    } else if (panState.current) {
      // ── Single-finger pan ────────────────────────────────────────────────
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const ps = panState.current
      applyTransform(
        ps.originPanX + (e.clientX - ps.startPointerX),
        ps.originPanY + (e.clientY - ps.startPointerY),
        currentZoom.current,
      )
    }

    // Emit cursor in canvas-space (divide by zoom)
    const { x: px, y: py } = currentPan.current
    throttledCursorMove((e.clientX - px) / currentZoom.current, (e.clientY - py) / currentZoom.current)
  }

  function handlePointerUp(e) {
    activePointers.current.delete(e.pointerId)
    if (activePointers.current.size === 1) {
      // One finger remaining — resume pan from current position
      const [[, pos]] = activePointers.current
      panState.current = {
        startPointerX: pos.x,
        startPointerY: pos.y,
        originPanX: currentPan.current.x,
        originPanY: currentPan.current.y,
      }
    } else if (activePointers.current.size === 0) {
      panState.current = null
    }
  }

  return (
    <div
      ref={outerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full overflow-hidden"
      style={{
        backgroundColor: '#232836',
        touchAction: 'none',
        cursor: 'grab',
      }}
    >
      {/* Inner layer — all cards and cursors live here, panned/zoomed via transform */}
      <div
        ref={innerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          willChange: 'transform',
          touchAction: 'none',
          transformOrigin: '0 0',
          overflow: 'hidden',
          background: 'radial-gradient(circle, #000000 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          backgroundColor: '#232836',
        }}
      >
        {/* Centre marker */}
        <div style={{
          position: 'absolute',
          left: CANVAS_SIZE / 2,
          top: CANVAS_SIZE / 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'hotpink',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />

        {[...cards.values()].map(card => (
          <PhotoCard
            key={card.id}
            card={card}
            isOwn={!!userName && card.name === userName}
            onDragEnd={onCardDragEnd}
            onFocus={onCardFocus}
            onDelete={onCardDelete}
            zoomRef={zoomRef}
            isPinchingRef={isPinchingRef}
          />
        ))}
        <RemoteCursors cursors={remoteCursors} />
      </div>
    </div>
  )
}

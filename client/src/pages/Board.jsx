import { useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

import BoardCanvas from '../components/BoardCanvas'
import CameraModal from '../components/CameraModal'
import EmojiPanel from '../components/EmojiPanel'
import NameModal from '../components/NameModal'
import Toolbar from '../components/Toolbar'

import { useBoard } from '../hooks/useBoard'
import { usePartyKit } from '../hooks/usePartyKit'
import { uploadImage } from '../lib/supabase'

const NAME_KEY = 'selfie-board:name'

function safeLocalStorage(key) {
  try { return localStorage.getItem(key) ?? '' } catch { return '' }
}
function safeLocalStorageSet(key, value) {
  try { localStorage.setItem(key, value) } catch { /* ignore */ }
}

function getRandomRotation() {
  return (Math.random() - 0.5) * 14
}

function randomPlacement(boardEl, { x: panX = 0, y: panY = 0, zoom = 1 } = {}, center = false) {
  if (!boardEl) return { x: 100, y: 100 }
  const { clientWidth: w, clientHeight: h } = boardEl
  const screenX = center ? w / 2 - 110 : 80 + Math.random() * Math.max(0, w - 260)
  const screenY = center ? h / 2 - 156 : 80 + Math.random() * Math.max(0, h - 300)
  return {
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  }
}

export default function Board() {
  const { roomId } = useParams()
  const [cameraOpen, setCameraOpen] = useState(false)
  const [userName, setUserName] = useState(() => safeLocalStorage(NAME_KEY))
  const [nameModalOpen, setNameModalOpen] = useState(() => !safeLocalStorage(NAME_KEY))
  const [uploading, setUploading] = useState(false)
  const [remoteCursors, setRemoteCursors] = useState(new Map())
  const [stickers, setStickers] = useState(new Map())
  const [stampEmoji, setStampEmoji] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const boardRef = useRef(null)
  const panOffsetRef = useRef({ x: 0, y: 0, zoom: 1 })

  const { cards, addCard, moveCard, bringToFront, loadCards, removeCard } = useBoard()

  // ── Sticker helpers ───────────────────────────────────────────────────────
  function addSticker(sticker) {
    setStickers(prev => { const n = new Map(prev); n.set(sticker.id, sticker); return n })
  }
  function moveStickerLocal(id, x, y) {
    setStickers(prev => {
      if (!prev.has(id)) return prev
      const n = new Map(prev)
      n.set(id, { ...n.get(id), x, y })
      return n
    })
  }
  function removeStickerLocal(id) {
    setStickers(prev => { const n = new Map(prev); n.delete(id); return n })
  }

  // ── PartyKit handlers ────────────────────────────────────────────────────
  const handleInit = useCallback((serverCards, serverStickers) => {
    loadCards(serverCards ?? [])
    const map = new Map()
    ;(serverStickers ?? []).forEach(s => map.set(s.id, s))
    setStickers(map)
  }, [loadCards])

  const handleRemoteCardAdd = useCallback((card) => {
    addCard(card)
  }, [addCard])

  const handleRemoteCardMove = useCallback((id, x, y) => {
    moveCard(id, x, y)
  }, [moveCard])

  const handleRemoteCardRemove = useCallback((id) => {
    removeCard(id)
  }, [removeCard])

  const handleCursorMove = useCallback((clientId, x, y, name) => {
    setRemoteCursors(prev => {
      const next = new Map(prev)
      next.set(clientId, { x, y, name })
      return next
    })
  }, [])

  const { emitCardAdd, emitCardMove, emitCardRemove, emitCursorMove, emitStickerAdd, emitStickerMove, emitStickerRemove } = usePartyKit({
    roomId,
    onInit: handleInit,
    onCardAdd: handleRemoteCardAdd,
    onCardMove: handleRemoteCardMove,
    onCardRemove: handleRemoteCardRemove,
    onCursorMove: handleCursorMove,
    onStickerAdd: useCallback((s) => addSticker(s), []),
    onStickerMove: useCallback((id, x, y) => moveStickerLocal(id, x, y), []),
    onStickerRemove: useCallback((id) => removeStickerLocal(id), []),
  })

  // ── Name handling ────────────────────────────────────────────────────────
  function saveName(name) {
    setUserName(name)
    safeLocalStorageSet(NAME_KEY, name)
    setNameModalOpen(false)
  }

  // ── Camera capture → upload → add card ──────────────────────────────────
  async function handleCapture(dataUrl) {
    setCameraOpen(false)
    setUploading(true)
    try {
      const cardId = uuidv4()
      let imageUrl
      try {
        imageUrl = await uploadImage(dataUrl, cardId)
      } catch {
        console.warn('Supabase upload failed, using local data URL (dev fallback)')
        imageUrl = dataUrl
      }

      const { x, y } = randomPlacement(boardRef.current, panOffsetRef.current, cards.size === 0)
      const card = {
        id: cardId,
        image_url: imageUrl,
        x,
        y,
        rotation: getRandomRotation(),
        name: userName || null,
        created_at: new Date().toISOString(),
      }

      addCard(card)
      emitCardAdd(card)
    } finally {
      setUploading(false)
    }
  }

  // ── Drag end ─────────────────────────────────────────────────────────────
  const handleCardDragEnd = useCallback((id, x, y) => {
    moveCard(id, x, y)
    emitCardMove(id, x, y)
  }, [moveCard, emitCardMove])

  const handleCardFocus = useCallback((id) => {
    bringToFront(id)
  }, [bringToFront])

  const handleCardDelete = useCallback((id) => {
    removeCard(id)
    emitCardRemove(id)
  }, [removeCard, emitCardRemove])

  // ── Sticker placement ─────────────────────────────────────────────────────
  const handleCanvasTap = useCallback((x, y) => {
    if (!stampEmoji) return
    const sticker = {
      id: uuidv4(),
      emoji: stampEmoji,
      x,
      y,
      rotation: (Math.random() - 0.5) * 20,
    }
    addSticker(sticker)
    emitStickerAdd(sticker)
  }, [stampEmoji, emitStickerAdd])

  const handleStickerDragEnd = useCallback((id, x, y) => {
    moveStickerLocal(id, x, y)
    emitStickerMove(id, x, y)
  }, [emitStickerMove])

  const handleStickerDelete = useCallback((id) => {
    removeStickerLocal(id)
    emitStickerRemove(id)
  }, [emitStickerRemove])

  // ── Cursor broadcast ─────────────────────────────────────────────────────
  const handleCursorBroadcast = useCallback((x, y) => {
    emitCursorMove(x, y, userName)
  }, [emitCursorMove, userName])

  // ── Copy link ─────────────────────────────────────────────────────────────
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // clipboard not available, silently ignore
    }
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div ref={boardRef} className="relative w-full h-full overflow-hidden">
      <BoardCanvas
        cards={cards}
        remoteCursors={remoteCursors}
        userName={userName}
        onCardDragEnd={handleCardDragEnd}
        onCardFocus={handleCardFocus}
        onCardDelete={handleCardDelete}
        onCursorMove={handleCursorBroadcast}
        panRef={panOffsetRef}
        stickers={stickers}
        stampEmoji={stampEmoji}
        onCanvasTap={handleCanvasTap}
        onStickerDragEnd={handleStickerDragEnd}
        onStickerDelete={handleStickerDelete}
      />

      <Toolbar
        roomId={roomId}
        userName={userName}
        onCameraOpen={() => setCameraOpen(true)}
        onNameEdit={() => setNameModalOpen(true)}
        onCopyLink={handleCopyLink}
      />

      <EmojiPanel activeEmoji={stampEmoji} onSelect={setStampEmoji} />

      {/* Upload indicator */}
      {uploading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm text-sm text-gray-700 px-4 py-2 rounded-xl shadow-lg border border-gray-100">
          Uploading photo…
        </div>
      )}

      {/* Link copied toast */}
      {linkCopied && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          Link copied!
        </div>
      )}

      {nameModalOpen && (
        <NameModal
          initial={userName}
          onConfirm={saveName}
          onSkip={() => setNameModalOpen(false)}
        />
      )}

      {cameraOpen && (
        <CameraModal
          onCapture={handleCapture}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  )
}

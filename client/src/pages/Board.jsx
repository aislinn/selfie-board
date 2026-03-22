import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

import BoardCanvas from '../components/BoardCanvas'
import CameraModal from '../components/CameraModal'
import Toolbar from '../components/Toolbar'

import { useBoard } from '../hooks/useBoard'
import { usePartyKit } from '../hooks/usePartyKit'
import { uploadImage } from '../lib/supabase'

const NAME_KEY = 'selfie-board:name'

function getRandomRotation() {
  return (Math.random() - 0.5) * 14 // -7° to +7°
}

function randomPlacement(boardEl) {
  if (!boardEl) return { x: 100, y: 100 }
  const { clientWidth: w, clientHeight: h } = boardEl
  return {
    x: 80 + Math.random() * Math.max(0, w - 260),
    y: 80 + Math.random() * Math.max(0, h - 300),
  }
}

export default function Board() {
  const { roomId } = useParams()
  const [cameraOpen, setCameraOpen] = useState(false)
  const [userName, setUserName] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [uploading, setUploading] = useState(false)
  const [remoteCursors, setRemoteCursors] = useState(new Map())
  const boardRef = useRef(null)

  const { cards, addCard, moveCard, bringToFront, loadCards } = useBoard()

  // ── PartyKit handlers ────────────────────────────────────────────────────
  const handleInit = useCallback((serverCards) => {
    loadCards(serverCards ?? [])
  }, [loadCards])

  const handleRemoteCardAdd = useCallback((card) => {
    addCard(card)
  }, [addCard])

  const handleRemoteCardMove = useCallback((id, x, y) => {
    moveCard(id, x, y)
  }, [moveCard])

  const handleCursorMove = useCallback((clientId, x, y, name) => {
    setRemoteCursors(prev => {
      const next = new Map(prev)
      next.set(clientId, { x, y, name })
      return next
    })
  }, [])

  const { emitCardAdd, emitCardMove, emitCursorMove } = usePartyKit({
    roomId,
    onInit: handleInit,
    onCardAdd: handleRemoteCardAdd,
    onCardMove: handleRemoteCardMove,
    onCursorMove: handleCursorMove,
  })

  // ── Name prompt on first visit ───────────────────────────────────────────
  useEffect(() => {
    if (!userName) {
      const name = prompt('What\'s your name? (shown on your selfies)') ?? ''
      if (name.trim()) {
        const trimmed = name.trim()
        setUserName(trimmed)
        localStorage.setItem(NAME_KEY, trimmed)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleNameEdit() {
    const name = prompt('Enter your name:', userName) ?? ''
    if (name.trim()) {
      const trimmed = name.trim()
      setUserName(trimmed)
      localStorage.setItem(NAME_KEY, trimmed)
    }
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
        // Supabase not configured — fall back to local data URL so the app
        // still works without a backend during development.
        console.warn('Supabase upload failed, using local data URL (dev fallback)')
        imageUrl = dataUrl
      }

      const { x, y } = randomPlacement(boardRef.current)
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

  // ── Focus (bring to front) ───────────────────────────────────────────────
  const handleCardFocus = useCallback((id) => {
    bringToFront(id)
  }, [bringToFront])

  // ── Cursor broadcast ─────────────────────────────────────────────────────
  const handleCursorBroadcast = useCallback((x, y) => {
    emitCursorMove(x, y, userName)
  }, [emitCursorMove, userName])

  return (
    <div ref={boardRef} className="relative w-full h-full overflow-hidden">
      <BoardCanvas
        cards={cards}
        remoteCursors={remoteCursors}
        onCardDragEnd={handleCardDragEnd}
        onCardFocus={handleCardFocus}
        onCursorMove={handleCursorBroadcast}
      />

      <Toolbar
        roomId={roomId}
        userName={userName}
        onCameraOpen={() => setCameraOpen(true)}
        onNameEdit={handleNameEdit}
      />

      {uploading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm text-sm text-gray-700 px-4 py-2 rounded-xl shadow-lg border border-gray-100">
          Uploading photo…
        </div>
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

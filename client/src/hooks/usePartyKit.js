import { useEffect, useRef, useCallback } from 'react'
import PartySocket from 'partysocket'

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999'

export function usePartyKit({
  roomId,
  onInit,
  onCardAdd, onCardMove, onCardRemove,
  onCursorMove,
  onStickerAdd, onStickerMove, onStickerRemove,
}) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!roomId) return

    const ws = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomId,
    })

    ws.addEventListener('message', (evt) => {
      let msg
      try { msg = JSON.parse(evt.data) } catch { return }

      switch (msg.type) {
        case 'init':
          onInit?.(msg.cards, msg.stickers ?? [])
          break
        case 'card:add':
          onCardAdd?.(msg.card)
          break
        case 'card:move':
          onCardMove?.(msg.id, msg.x, msg.y)
          break
        case 'card:remove':
          onCardRemove?.(msg.id)
          break
        case 'cursor:move':
          onCursorMove?.(msg.clientId, msg.x, msg.y, msg.name)
          break
        case 'sticker:add':
          onStickerAdd?.(msg.sticker)
          break
        case 'sticker:move':
          onStickerMove?.(msg.id, msg.x, msg.y)
          break
        case 'sticker:remove':
          onStickerRemove?.(msg.id)
          break
        default:
          break
      }
    })

    socketRef.current = ws

    return () => {
      ws.close()
      socketRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  const send = useCallback((msg) => {
    socketRef.current?.send(JSON.stringify(msg))
  }, [])

  const emitCardAdd = useCallback((card) => {
    send({ type: 'card:add', card })
  }, [send])

  const emitCardMove = useCallback((id, x, y) => {
    send({ type: 'card:move', id, x, y })
  }, [send])

  const emitCardRemove = useCallback((id) => {
    send({ type: 'card:remove', id })
  }, [send])

  const emitCursorMove = useCallback((x, y, name) => {
    send({ type: 'cursor:move', x, y, name })
  }, [send])

  const emitStickerAdd = useCallback((sticker) => {
    send({ type: 'sticker:add', sticker })
  }, [send])

  const emitStickerMove = useCallback((id, x, y) => {
    send({ type: 'sticker:move', id, x, y })
  }, [send])

  const emitStickerRemove = useCallback((id) => {
    send({ type: 'sticker:remove', id })
  }, [send])

  return { emitCardAdd, emitCardMove, emitCardRemove, emitCursorMove, emitStickerAdd, emitStickerMove, emitStickerRemove }
}

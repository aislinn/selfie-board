import { useEffect, useRef, useCallback } from 'react'
import PartySocket from 'partysocket'

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999'

export function usePartyKit({ roomId, onCardAdd, onCardMove, onCardRemove, onCardRename, onCursorMove, onInit }) {
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
          onInit?.(msg.cards)
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
        case 'card:rename':
          onCardRename?.(msg.ids, msg.name)
          break
        case 'cursor:move':
          onCursorMove?.(msg.clientId, msg.x, msg.y, msg.name)
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
    // PartySocket buffers sends during reconnection — no readyState check needed
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

  const emitCardRename = useCallback((ids, name) => {
    send({ type: 'card:rename', ids, name })
  }, [send])

  const emitCursorMove = useCallback((x, y, name) => {
    send({ type: 'cursor:move', x, y, name })
  }, [send])

  return { emitCardAdd, emitCardMove, emitCardRemove, emitCardRename, emitCursorMove }
}

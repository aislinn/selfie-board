import type * as Party from 'partykit/server'

// ── Types ────────────────────────────────────────────────────────────────────

interface Card {
  id: string
  room_id: string
  image_url: string
  x: number
  y: number
  rotation: number
  name: string | null
  created_at: string
}

type IncomingMessage =
  | { type: 'card:add'; card: Card }
  | { type: 'card:move'; id: string; x: number; y: number }
  | { type: 'cursor:move'; x: number; y: number; name: string | null }

// ── Supabase REST helpers ────────────────────────────────────────────────────

async function dbFetch(
  supabaseUrl: string,
  serviceKey: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${supabaseUrl}/rest/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'return=representation',
      ...(options.headers ?? {}),
    },
  })
}

async function getCardsForRoom(supabaseUrl: string, serviceKey: string, roomId: string): Promise<Card[]> {
  if (!supabaseUrl || !serviceKey) return []
  try {
    const res = await dbFetch(supabaseUrl, serviceKey, `/cards?room_id=eq.${encodeURIComponent(roomId)}&order=created_at.asc`)
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

async function insertCard(supabaseUrl: string, serviceKey: string, card: Card): Promise<void> {
  if (!supabaseUrl || !serviceKey) return
  await dbFetch(supabaseUrl, serviceKey, '/cards', {
    method: 'POST',
    body: JSON.stringify(card),
  })
}

async function updateCardPosition(supabaseUrl: string, serviceKey: string, id: string, x: number, y: number): Promise<void> {
  if (!supabaseUrl || !serviceKey) return
  await dbFetch(supabaseUrl, serviceKey, `/cards?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ x, y }),
  })
}

// ── PartyKit Server ──────────────────────────────────────────────────────────

export default class SelfieBoard implements Party.Server {
  private cards: Card[] = []
  private loaded = false

  constructor(readonly room: Party.Room) {}

  private get supabaseUrl(): string {
    return (this.room.env as Record<string, string>).SUPABASE_URL ?? ''
  }

  private get serviceKey(): string {
    return (this.room.env as Record<string, string>).SUPABASE_SERVICE_KEY ?? ''
  }

  /** HTTP handler — returns current board state as JSON (useful for SSR prefetch) */
  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === 'GET') {
      if (!this.loaded) {
        this.cards = await getCardsForRoom(this.supabaseUrl, this.serviceKey, this.room.id)
        this.loaded = true
      }
      return new Response(JSON.stringify(this.cards), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
    return new Response('Method Not Allowed', { status: 405 })
  }

  /** Called when a new WebSocket connection opens */
  async onConnect(conn: Party.Connection): Promise<void> {
    if (!this.loaded) {
      this.cards = await getCardsForRoom(this.supabaseUrl, this.serviceKey, this.room.id)
      this.loaded = true
    }
    conn.send(JSON.stringify({ type: 'init', cards: this.cards }))
  }

  /** Called for every message received from a client */
  async onMessage(message: string, sender: Party.Connection): Promise<void> {
    let msg: IncomingMessage
    try {
      msg = JSON.parse(message)
    } catch {
      return
    }

    switch (msg.type) {
      case 'card:add': {
        const card: Card = { ...msg.card, room_id: this.room.id }
        this.cards.push(card)
        insertCard(this.supabaseUrl, this.serviceKey, card).catch(console.error)
        this.room.broadcast(JSON.stringify({ type: 'card:add', card }), [sender.id])
        break
      }

      case 'card:move': {
        const idx = this.cards.findIndex(c => c.id === msg.id)
        if (idx !== -1) {
          this.cards[idx] = { ...this.cards[idx], x: msg.x, y: msg.y }
        }
        updateCardPosition(this.supabaseUrl, this.serviceKey, msg.id, msg.x, msg.y).catch(console.error)
        this.room.broadcast(JSON.stringify({ type: 'card:move', id: msg.id, x: msg.x, y: msg.y }), [sender.id])
        break
      }

      case 'cursor:move': {
        this.room.broadcast(
          JSON.stringify({ type: 'cursor:move', clientId: sender.id, x: msg.x, y: msg.y, name: msg.name }),
          [sender.id]
        )
        break
      }
    }
  }
}

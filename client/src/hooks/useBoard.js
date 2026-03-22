import { useState, useCallback } from 'react'

export function useBoard() {
  // cards: Map<id, { id, image_url, x, y, rotation, name, created_at, zIndex }>
  const [cards, setCards] = useState(new Map())
  const [maxZ, setMaxZ] = useState(1)

  const addCard = useCallback((card) => {
    setMaxZ(z => {
      const newZ = z + 1
      setCards(prev => {
        const next = new Map(prev)
        next.set(card.id, { ...card, zIndex: newZ })
        return next
      })
      return newZ
    })
  }, [])

  const moveCard = useCallback((id, x, y) => {
    setCards(prev => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      next.set(id, { ...next.get(id), x, y })
      return next
    })
  }, [])

  const bringToFront = useCallback((id) => {
    setMaxZ(z => {
      const newZ = z + 1
      setCards(prev => {
        if (!prev.has(id)) return prev
        const next = new Map(prev)
        next.set(id, { ...next.get(id), zIndex: newZ })
        return next
      })
      return newZ
    })
  }, [])

  const loadCards = useCallback((cardArray) => {
    const map = new Map()
    let max = 1
    cardArray.forEach((c, i) => {
      const z = i + 1
      max = z
      map.set(c.id, { ...c, zIndex: z })
    })
    setCards(map)
    setMaxZ(max)
  }, [])

  return { cards, addCard, moveCard, bringToFront, loadCards }
}

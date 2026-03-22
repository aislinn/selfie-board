const EMOJIS = ['❤️', '🔥', '✨', '🎉', '😂']

/**
 * Props:
 *   activeEmoji – currently selected emoji or null
 *   onSelect(emoji|null) – called when an emoji is tapped; null to deselect
 */
export default function EmojiPanel({ activeEmoji, onSelect }) {
  return (
    <div className="absolute bottom-6 left-6 z-40 flex items-center gap-1 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl px-3 py-2.5 border border-gray-100">
      {EMOJIS.map(emoji => (
        <button
          key={emoji}
          onPointerDown={() => onSelect(activeEmoji === emoji ? null : emoji)}
          title={`Stamp ${emoji}`}
          style={{
            fontSize: 24,
            lineHeight: 1,
            padding: '5px 6px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            background: activeEmoji === emoji ? 'rgba(0,0,0,0.09)' : 'transparent',
            transform: activeEmoji === emoji ? 'scale(1.25)' : 'scale(1)',
            transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), background 0.1s ease',
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

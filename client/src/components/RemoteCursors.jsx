/**
 * Renders other users' cursors on the board.
 *
 * Props:
 *   cursors – Map<clientId, { x, y, name }>
 */
export default function RemoteCursors({ cursors }) {
  return (
    <>
      {[...cursors.entries()].map(([clientId, { x, y, name }]) => (
        <div
          key={clientId}
          className="absolute pointer-events-none z-[9999]"
          style={{ left: x, top: y, transform: 'translate(-2px, -2px)' }}
        >
          {/* Cursor dot */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M4 2L18 10L10 12L7 18L4 2Z"
              fill="#6366f1"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
          {/* Name label */}
          {name && (
            <span className="absolute top-5 left-2 text-[11px] font-medium bg-indigo-500 text-white px-1.5 py-0.5 rounded-md whitespace-nowrap shadow">
              {name}
            </span>
          )}
        </div>
      ))}
    </>
  )
}

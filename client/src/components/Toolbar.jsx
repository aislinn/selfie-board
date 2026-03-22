/**
 * Props:
 *   roomId         – string
 *   userName       – string
 *   onCameraOpen() – open the camera modal
 *   onNameEdit()   – open the name modal
 *   onCopyLink()   – copy board URL to clipboard
 */
export default function Toolbar({ roomId, userName, onCameraOpen, onNameEdit, onCopyLink }) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl px-4 py-2.5 border border-gray-100">
      {/* Take selfie */}
      <button
        onPointerDown={onCameraOpen}
        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 active:scale-95 transition-all"
      >
        📷 Snap
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* Name badge */}
      <button
        onPointerDown={onNameEdit}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        title="Edit your name"
      >
        <span className="text-base">👤</span>
        <span className="max-w-[80px] truncate">{userName || 'Add name'}</span>
      </button>

      <div className="w-px h-6 bg-gray-200" />

      {/* Copy link */}
      <button
        onPointerDown={onCopyLink}
        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        title="Copy board link"
      >
        🔗
      </button>

      <span className="text-xs text-gray-300 font-mono hidden sm:inline">{roomId}</span>
    </div>
  )
}

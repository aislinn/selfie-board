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
    <>
      {/* Standalone shutter button — bottom centre */}
      <button
        onPointerDown={onCameraOpen}
        className="shutter-btn absolute bottom-10 left-1/2 -translate-x-1/2 z-40 drop-shadow-xl"
        title="Take selfie"
        aria-label="Take selfie"
      >
        <svg width="72" height="72" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M90 0C139.706 0 180 40.2944 180 90C180 139.706 139.706 180 90 180C40.2944 180 0 139.706 0 90C0 40.2944 40.2944 0 90 0ZM90 10C45.8172 10 10 45.8172 10 90C10 134.183 45.8172 170 90 170C134.183 170 170 134.183 170 90C170 45.8172 134.183 10 90 10Z" fill="white"/>
          <circle cx="90" cy="90" r="71" fill="white"/>
        </svg>
      </button>

      {/* Info pill — bottom right */}
      <div className="absolute bottom-6 right-6 z-40 flex items-center gap-3 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl px-4 py-2.5 border border-gray-100">
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
    </>
  )
}

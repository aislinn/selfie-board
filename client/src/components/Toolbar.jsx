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
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-40 drop-shadow-xl">
      <button
        onPointerDown={onCameraOpen}
        className="shutter-btn"
        title="Take selfie"
        aria-label="Take selfie"
      >
        <svg width="72" height="72" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M90 0C139.706 0 180 40.2944 180 90C180 139.706 139.706 180 90 180C40.2944 180 0 139.706 0 90C0 40.2944 40.2944 0 90 0ZM90 10C45.8172 10 10 45.8172 10 90C10 134.183 45.8172 170 90 170C134.183 170 170 134.183 170 90C170 45.8172 134.183 10 90 10Z" fill="white"/>
          <circle cx="90" cy="90" r="71" fill="white"/>
        </svg>
      </button>
      </div>

      {/* Info pill — bottom right */}
      <div className="pill-top absolute left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:bottom-12 sm:right-6 z-40 flex items-center bg-white/70 backdrop-blur-sm shadow-xl rounded-full px-4 py-1.5 border border-gray-100">
        <button
          onPointerDown={onNameEdit}
          className="flex items-center text-sm text-gray-900 hover:text-gray-900 transition-colors cursor-pointer"
          title="Edit your name"
        >
          <span className="mr-1">Posting as</span>
          <span className="max-w-[80px] truncate font-semibold">{userName || 'Add name'}</span>
        </button>
      </div>
    </>
  )
}

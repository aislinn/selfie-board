import { useEffect, useState } from 'react'
import { useCamera } from '../hooks/useCamera'

/**
 * Props:
 *   onCapture(dataUrl) – called when user confirms a photo
 *   onClose()          – called when user dismisses the modal
 */
export default function CameraModal({ onCapture, onClose }) {
  const { videoRef, isStreaming, error, facingMode, startCamera, stopCamera, flipCamera, capturePhoto } = useCamera()
  const [preview, setPreview] = useState(null) // base64 data URL while reviewing

  useEffect(() => {
    startCamera()
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSnap() {
    const dataUrl = capturePhoto(0.7)
    if (dataUrl) setPreview(dataUrl)
  }

  function handleConfirm() {
    if (preview) {
      onCapture(preview)
      stopCamera()
    }
  }

  function handleRetake() {
    setPreview(null)
  }

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) {
      stopCamera()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onPointerDown={handleBackdrop}
    >
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-semibold text-gray-800">Take a selfie</span>
          <button
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
            onPointerDown={(e) => { e.stopPropagation(); stopCamera(); onClose() }}
          >
            ×
          </button>
        </div>

        {/* Video / preview area */}
        <div className="relative bg-black aspect-[3/4] w-full overflow-hidden">
          {!preview ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              {error && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm text-center px-6">
                  <p>⚠️ {error}</p>
                </div>
              )}
            </>
          ) : (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-around px-6 py-5">
          {!preview ? (
            <>
              {/* Flip camera */}
              <button
                onPointerDown={flipCamera}
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl hover:bg-gray-200 active:scale-95 transition-all"
                title="Flip camera"
              >
                🔄
              </button>

              {/* Shutter */}
              <button
                onPointerDown={handleSnap}
                disabled={!isStreaming}
                className="w-16 h-16 rounded-full bg-gray-900 border-4 border-white ring-2 ring-gray-300 flex items-center justify-center disabled:opacity-40 hover:bg-gray-700 active:scale-95 transition-all shadow-md"
                title="Snap"
              >
                <span className="sr-only">Take photo</span>
              </button>

              {/* Spacer (balances layout) */}
              <div className="w-12 h-12" />
            </>
          ) : (
            <>
              {/* Retake */}
              <button
                onPointerDown={handleRetake}
                className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 active:scale-95 transition-all"
              >
                Retake
              </button>

              {/* Confirm */}
              <button
                onPointerDown={handleConfirm}
                className="px-5 py-2 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-700 active:scale-95 transition-all"
              >
                Use photo ✓
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

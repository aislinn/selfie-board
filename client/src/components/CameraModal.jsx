import { useEffect, useState } from 'react'
import { useCamera } from '../hooks/useCamera'

/**
 * Props:
 *   onCapture(dataUrl) – called when user confirms a photo
 *   onClose()          – called when user dismisses the modal
 */
export default function CameraModal({ onCapture, onClose }) {
  const { videoRef, isStreaming, error, facingMode, startCamera, stopCamera, flipCamera, capturePhoto } = useCamera()
  const [preview, setPreview] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    startCamera()
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => {
      cancelAnimationFrame(raf)
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss(cb) {
    setVisible(false)
    setTimeout(cb, 220)
  }

  function handleSnap() {
    const dataUrl = capturePhoto(0.7)
    if (dataUrl) setPreview(dataUrl)
  }

  function handleConfirm() {
    if (preview) {
      const data = preview
      dismiss(() => { stopCamera(); onCapture(data) })
    }
  }

  function handleRetake() {
    setPreview(null)
  }

  function handleClose(e) {
    e.stopPropagation()
    dismiss(() => { stopCamera(); onClose() })
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) {
      dismiss(() => { stopCamera(); onClose() })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 sm:flex sm:items-center sm:justify-center"
      style={{ background: 'rgba(35,40,54,0)', touchAction: 'pan-x pan-y' }}
      onPointerDown={handleBackdrop}
    >
      {/* Desktop backdrop */}
      <div
        className="hidden sm:block absolute inset-0 backdrop-blur-sm"
        style={{
          background: 'rgba(10,13,22,0.85)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
        onPointerDown={() => dismiss(() => { stopCamera(); onClose() })}
      />

      {/* Card — full screen on mobile, constrained dark card on desktop */}
      <div
        className="relative flex flex-col w-full h-full sm:h-auto sm:max-w-sm sm:rounded-3xl overflow-hidden"
        style={{
          background: '#1A1F2B',
          border: '1px solid rgba(255,255,255,0.08)',
          borderBottom: 'none',
          boxShadow: '0 -4px 60px rgba(0,0,0,0.6)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div
          className="relative flex items-center justify-center px-5 py-4 z-10"
        >
          <span style={{ color: '#fff', fontWeight: 400, fontSize: 18, letterSpacing: '-0.3px' }}>
            Take a selfie
          </span>
          <button
            onPointerDown={handleClose}
            className="absolute flex items-center justify-center"
            style={{ right: 20, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', background: 'none', border: 'none', padding: 4 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Video / preview — fills remaining space on mobile, square on desktop */}
        <div className="relative bg-black overflow-hidden flex-1 sm:flex-none sm:aspect-square w-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none', display: preview ? 'none' : 'block', pointerEvents: 'none', touchAction: 'none' }}
          />
          {error && !preview && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm text-center px-6">
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>⚠️ {error}</p>
            </div>
          )}
          {preview && (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Controls — pb-10 keeps shutter button at same position as canvas button */}
        <div
          className="flex items-center px-6"
          style={{ height: 116 }}
        >
          {!preview ? (
            <div className="grid grid-cols-3 items-center w-full">
              {/* Flip camera — centred in left third */}
              <div className="flex justify-center">
              <button
                onPointerDown={flipCamera}
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl active:scale-95 transition-all backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer' }}
                title="Flip camera"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4V10H7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 20V14H17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.49 9C19.84 7.07 18.54 5.42 16.8 4.32C15.06 3.22 13 2.73 10.95 2.94C8.9 3.15 6.98 4.05 5.5 5.5L1 10M23 14L18.5 18.5C17.02 19.95 15.1 20.85 13.05 21.06C11 21.27 8.94 20.78 7.2 19.68C5.46 18.58 4.16 16.93 3.51 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              </div>

              {/* Shutter — centred in middle third */}
              <div className="flex justify-center">
                <button
                  onPointerDown={handleSnap}
                  disabled={!isStreaming}
                  className="shutter-btn"
                  title="Take photo"
                  aria-label="Take photo"
                >
                  <svg width="72" height="72" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M90 0C139.706 0 180 40.2944 180 90C180 139.706 139.706 180 90 180C40.2944 180 0 139.706 0 90C0 40.2944 40.2944 0 90 0ZM90 10C45.8172 10 10 45.8172 10 90C10 134.183 45.8172 170 90 170C134.183 170 170 134.183 170 90C170 45.8172 134.183 10 90 10Z" fill="white"/>
                    <circle cx="90" cy="90" r="71" fill="white"/>
                  </svg>
                </button>
              </div>

              {/* Empty right third */}
              <div />
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              {/* Retake */}
              <button
                onPointerDown={handleRetake}
                className="flex-1 active:scale-95 transition-all backdrop-blur-sm"
                style={{
                  height: 44,
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 15,
                  fontWeight: 400,
                  cursor: 'pointer',
                  letterSpacing: '-0.2px',
                }}
              >
                Retake
              </button>

              {/* Use photo */}
              <button
                onPointerDown={handleConfirm}
                className="flex-1 active:scale-95 transition-all"
                style={{
                  height: 44,
                  borderRadius: 14,
                  border: 'none',
                  background: '#fff',
                  color: '#111',
                  fontSize: 15,
                  fontWeight: 400,
                  cursor: 'pointer',
                  letterSpacing: '-0.2px',
                }}
              >
                Use photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

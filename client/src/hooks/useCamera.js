import { useRef, useState, useCallback } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [facingMode, setFacingMode] = useState('user')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)

  const startCamera = useCallback(async (facing = facingMode) => {
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsStreaming(true)
    } catch (err) {
      setError(err.message ?? 'Camera access denied')
      setIsStreaming(false)
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }, [])

  const flipCamera = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    startCamera(next)
  }, [facingMode, startCamera])

  /**
   * Capture the current video frame and compress it.
   * Returns a base64 JPEG data URL.
   */
  const capturePhoto = useCallback((quality = 0.7) => {
    const video = videoRef.current
    if (!video) return null

    const canvas = document.createElement('canvas')
    const maxDim = 1280
    const ratio = Math.min(maxDim / video.videoWidth, maxDim / video.videoHeight, 1)
    canvas.width = Math.round(video.videoWidth * ratio)
    canvas.height = Math.round(video.videoHeight * ratio)

    const ctx = canvas.getContext('2d')

    // Mirror the image when using front camera so it looks natural
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    return canvas.toDataURL('image/jpeg', quality)
  }, [facingMode])

  return { videoRef, isStreaming, error, facingMode, startCamera, stopCamera, flipCamera, capturePhoto }
}

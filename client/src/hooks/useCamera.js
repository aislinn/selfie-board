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

    // Crop to a square from the center of the video frame
    const size = Math.min(video.videoWidth, video.videoHeight)
    const sx = (video.videoWidth - size) / 2
    const sy = (video.videoHeight - size) / 2

    const maxDim = 1080
    const dim = Math.min(size, maxDim)
    const canvas = document.createElement('canvas')
    canvas.width = dim
    canvas.height = dim

    const ctx = canvas.getContext('2d')

    // Mirror the image when using front camera so it looks natural
    if (facingMode === 'user') {
      ctx.translate(dim, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, sx, sy, size, size, 0, 0, dim, dim)

    return canvas.toDataURL('image/jpeg', quality)
  }, [facingMode])

  return { videoRef, isStreaming, error, facingMode, startCamera, stopCamera, flipCamera, capturePhoto }
}

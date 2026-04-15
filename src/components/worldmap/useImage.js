import { useState, useEffect } from 'react'

/**
 * Simple hook to load an image URL into an HTMLImageElement for Konva.
 */
export default function useImage(src) {
  const [image, setImage] = useState(null)

  useEffect(() => {
    if (!src) { setImage(null); return }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => setImage(img)
    img.onerror = () => setImage(null)
    img.src     = src
    return () => { img.onload = null; img.onerror = null }
  }, [src])

  return [image]
}

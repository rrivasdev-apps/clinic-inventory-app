'use client'

import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { X, Camera, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onScan:  (code: string) => void
  onClose: () => void
}

type ScanState = 'requesting' | 'scanning' | 'error'

export default function QrScanner({ onScan, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef    = useRef<number>(0)

  const [state, setState]       = useState<ScanState>('requesting')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    startCamera()
    return stopCamera
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setState('scanning')
        scanFrame()
      }
    } catch (err) {
      const msg = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Permiso de cámara denegado. Actívalo en los ajustes del navegador.'
        : 'No se pudo acceder a la cámara.'
      setErrorMsg(msg)
      setState('error')
    }
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  function scanFrame() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame)
      return
    }

    const ctx = canvas.getContext('2d')!
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code?.data) {
      stopCamera()
      onScan(code.data)
    } else {
      rafRef.current = requestAnimationFrame(scanFrame)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <p className="text-sm font-medium flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Apunta al código QR del producto
        </p>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-white/20">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Camera / error */}
      <div className="flex-1 relative flex items-center justify-center">
        {state === 'error' ? (
          <div className="text-center text-white px-8 space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-orange-400" />
            <p className="text-sm">{errorMsg}</p>
            <Button variant="outline" onClick={onClose} className="border-white text-white hover:bg-white/20">
              Cerrar
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Scan frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                {state === 'scanning' && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-green-400 animate-[scan_2s_ease-in-out_infinite]" />
                )}
              </div>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <p className="text-center text-white/60 text-xs pb-8 px-4">
        El escáner detecta automáticamente el código — sin necesidad de tocar la pantalla
      </p>
    </div>
  )
}

'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'
import { useRef } from 'react'

interface Props {
  value:     string     // the data to encode (product code or ID)
  label?:    string     // text shown below the QR
  size?:     number
  showPrint?: boolean
}

export default function QrCode({ value, label, size = 160, showPrint = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const win = window.open('', '_blank')
    if (!win || !containerRef.current) return

    const svg = containerRef.current.querySelector('svg')?.outerHTML ?? ''
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR ${label ?? value}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
            svg  { width: 200px; height: 200px; }
            p    { margin-top: 8px; font-size: 14px; font-weight: 600; text-align: center; }
            small { display: block; font-size: 10px; color: #6b7280; margin-top: 2px; }
            @media print { @page { size: 60mm 70mm; margin: 4mm } }
          </style>
        </head>
        <body>
          ${svg}
          ${label ? `<p>${label}</p>` : ''}
          <small>${value}</small>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={containerRef} className="p-2 bg-white rounded-lg border">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          includeMargin={false}
        />
      </div>
      {label && <p className="text-xs font-medium text-center">{label}</p>}
      {showPrint && (
        <button
          onClick={handlePrint}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Download className="h-3 w-3" />
          Imprimir etiqueta
        </button>
      )}
    </div>
  )
}

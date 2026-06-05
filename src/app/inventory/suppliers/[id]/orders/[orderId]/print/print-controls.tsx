'use client'

export default function PrintControls() {
  return (
    <div className="print:hidden p-4 flex gap-2 border-b">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
      >
        Imprimir / Guardar PDF
      </button>
      <button
        onClick={() => history.back()}
        className="rounded-lg border px-4 py-2 text-sm"
      >
        Volver
      </button>
    </div>
  )
}

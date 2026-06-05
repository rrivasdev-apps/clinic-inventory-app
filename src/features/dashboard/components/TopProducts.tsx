import type { TopProduct } from '../queries'

interface Props {
  products: TopProduct[]
}

export default function TopProducts({ products }: Props) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Sin datos de consumo en los últimos 30 días
      </p>
    )
  }

  const max = products[0].totalUsage

  return (
    <ol className="space-y-2">
      {products.map((p, i) => (
        <li key={p.id} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums shrink-0">
                {p.totalUsage} {p.unit}
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-400"
                style={{ width: `${(p.totalUsage / max) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

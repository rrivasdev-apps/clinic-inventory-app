import { Badge } from '@/components/ui/badge'
import { getStockStatus, stockStatusConfig } from '@/features/inventory/utils'

import { cn } from '@/lib/utils'

interface Props {
  stockCurrent: number
  stockMinimum: number
  className?: string
}

export default function StockStatusBadge({ stockCurrent, stockMinimum, className }: Props) {
  const status = getStockStatus({ stock_current: stockCurrent, stock_minimum: stockMinimum })
  const config = stockStatusConfig[status]

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

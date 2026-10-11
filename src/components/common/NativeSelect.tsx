import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// <select> nativo con el estilo de los inputs de shadcn/ui.
// Es accesible y funciona bien en celulares sin dependencias extra.
export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-9 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition-colors',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

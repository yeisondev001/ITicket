import { Link } from 'react-router'
import { buttonVariants } from '@/components/ui/button'

export function NoEncontradoPage() {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-lg font-semibold">No encontramos esta página</h1>
      <Link to="/" className={buttonVariants({ variant: 'outline' })}>
        Ir al inicio
      </Link>
    </div>
  )
}

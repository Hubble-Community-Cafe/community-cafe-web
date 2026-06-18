import { cn } from '@cafe/shared-web'

/**
 * The two cafe brand marks (icons only, no wordmark) stacked vertically, Hubble
 * on top. The admin manages both bars, so it shows both marks rather than
 * adopting either brand's identity. Each mark sits in an equal square box
 * (object-contain) so they read as the same size despite different proportions.
 */
export function BrandLogos({ className, size = 40 }: { className?: string; size?: number }) {
  const box = { height: size, width: size }
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <img
        src="/hubble-mark.webp"
        alt="Hubble Community Cafe"
        style={box}
        className="object-contain"
      />
      <img
        src="/meteor-mark.png"
        alt="Meteor Community Cafe"
        style={box}
        className="object-contain"
      />
    </div>
  )
}

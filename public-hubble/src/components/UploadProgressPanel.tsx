import type { UploadProgress } from '@cafe/shared-web'

/** A moving band for the steps where we cannot say how far along it is. */
const indeterminate: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(90deg, var(--color-hubble-200) 25%, var(--color-hubble-500) 50%, var(--color-hubble-200) 75%)',
  backgroundSize: '240% 100%',
  // The shared keyframes, so the global reduced-motion rule freezes it like every other animation.
  animation: 'shimmer 1.3s linear infinite',
}

/**
 * Shows a large poster upload: a bar with the percentage while the file is sent, then a moving
 * band while the server checks the poster, which can take up to half a minute. Screen readers
 * hear the step, not every percentage.
 */
export function UploadProgressPanel({ progress }: { progress: UploadProgress }) {
  const uploading = progress.phase === 'uploading'
  const percent = uploading ? progress.percent : null
  const step = uploading ? 'Uploading poster…' : 'Checking your poster…'

  return (
    <div className="rounded-lg border border-hubble-100 bg-hubble-50 px-4 py-3">
      <p className="text-sm font-semibold text-hubble-800">
        <span role="status">{step}</span>
        {percent !== null && <span aria-hidden="true"> {percent}%</span>}
      </p>
      <div
        role="progressbar"
        aria-label={step}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
        className="mt-2 h-2 overflow-hidden rounded-full bg-hubble-100"
      >
        {percent !== null ? (
          <div className="h-full rounded-full bg-hubble-600 transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }} />
        ) : (
          <div className="h-full w-full rounded-full" style={indeterminate} />
        )}
      </div>
      {!uploading && (
        <p className="mt-2 text-xs text-hubble-800/70">This can take up to half a minute.</p>
      )}
    </div>
  )
}

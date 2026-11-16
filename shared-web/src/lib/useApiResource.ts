import { useEffect, useState } from 'react'

/** What a page knows about data it loads once: the data so far, whether it is in, and if it failed. */
export interface ApiResource<T> {
  /** `initial` until the load succeeds; kept as `initial` when it fails. */
  data: T
  /** True once the load has finished, successfully or not. */
  loaded: boolean
  /** True when the load failed. */
  error: boolean
}

/**
 * Load data once when a component mounts. Replaces the useState/useEffect/then/catch/finally block
 * every public page used to repeat, so each page only says what to load and how to report a
 * failure. A response that arrives after the component unmounted is dropped.
 *
 * `onError` is the caller's, not built in: pages report through `reportApiFailure` with their own
 * label, and their tests replace that function through the `@cafe/shared-web` module mock, which an
 * import inside this file would bypass.
 */
export function useApiResource<T>(
  load: () => Promise<T>,
  initial: T,
  onError: (err: unknown) => void,
): ApiResource<T> {
  const [state, setState] = useState<ApiResource<T>>({ data: initial, loaded: false, error: false })

  useEffect(() => {
    let mounted = true
    load()
      .then((data) => {
        if (mounted) setState({ data, loaded: true, error: false })
      })
      .catch((err: unknown) => {
        onError(err)
        if (mounted) setState((prev) => ({ ...prev, loaded: true, error: true }))
      })
    return () => {
      mounted = false
    }
    // Once per mount, like the code it replaces: callers pass inline functions, which are new on
    // every render, so listing them would reload on every render.
  }, [])

  return state
}

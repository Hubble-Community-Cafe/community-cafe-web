// Minimal ambient typing for the build-time env vars the API client reads.
// The consuming Vite apps provide the full `vite/client` types; shared-web only
// needs these two to typecheck on its own.
interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_URL?: string
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

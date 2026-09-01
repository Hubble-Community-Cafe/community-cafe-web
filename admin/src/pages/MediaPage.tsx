import { useEffect, useRef, useState } from 'react'
import { Trash2, Upload, Copy, Check } from 'lucide-react'
import { usePermissions } from '../lib/usePermissions'
import { fetchAllMedia, uploadMedia, deleteMedia, type MediaAsset, type BarLocation } from '../lib/api'
import { formatBytes, validateUploadFile, MAX_UPLOAD_LABEL } from '../lib/upload'

const BARS: (BarLocation | '')[] = ['', 'HUBBLE', 'METEOR']
const BAR_LABELS: Record<string, string> = { '': 'Shared', HUBBLE: 'Hubble', METEOR: 'Meteor' }

function AssetCard({
  asset,
  canEdit,
  onDeleted,
}: {
  asset: MediaAsset
  canEdit: boolean
  onDeleted: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const copyUrl = async () => {
    await navigator.clipboard.writeText(asset.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${asset.filename}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteMedia(asset.id)
      onDeleted()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-video bg-slate-100">
        <img
          src={asset.url}
          alt={asset.alt ?? ''}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={copyUrl}
            title="Copy URL"
            className="rounded-full bg-white p-2 text-slate-700 hover:bg-slate-100"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </button>
          {canEdit && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete"
              className="rounded-full bg-white p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="px-3 py-2">
        <p className="truncate text-xs font-medium text-slate-700">{asset.filename}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
          {asset.bar && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-medium">
              {BAR_LABELS[asset.bar]}
            </span>
          )}
          {formatBytes(asset.sizeBytes)}
        </div>
        {asset.alt && (
          <p className="mt-0.5 truncate text-xs text-slate-400">{asset.alt}</p>
        )}
      </div>
    </div>
  )
}

export function MediaPage() {
  const { canEditContent } = usePermissions()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [alt, setAlt] = useState('')
  const [bar, setBar] = useState<BarLocation | ''>('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setAssets(await fetchAllMedia())
    } catch {
      setError('Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const problem = validateUploadFile(file)
    if (problem) {
      setUploadError(problem)
      return
    }

    setUploading(true)
    setUploadError(null)
    try {
      const uploaded = await uploadMedia(file, alt || undefined, bar || undefined)
      setAssets((prev) => [uploaded, ...prev])
      setAlt('')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Media library</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload images for events, board members, and menu items.
          JPEG, PNG, WebP and GIF, max {MAX_UPLOAD_LABEL} each.
        </p>
      </div>

      {/* Upload panel */}
      {canEditContent && (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Upload image</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600">Alt text</label>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image for screen readers"
              className="mt-1 w-64 rounded border border-slate-200 px-2.5 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Bar</label>
            <select
              value={bar}
              onChange={(e) => setBar(e.target.value as BarLocation | '')}
              className="mt-1 rounded border border-slate-200 px-2.5 py-1.5 text-sm"
            >
              {BARS.map((b) => (
                <option key={b} value={b}>{BAR_LABELS[b]}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleUpload}
              className="sr-only"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded bg-hubble-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading…' : 'Choose file'}
            </button>
          </div>
        </div>
        {uploadError && (
          <p role="alert" className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {uploadError}
          </p>
        )}
      </section>
      )}

      {loading && <p className="text-sm text-slate-400">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && assets.length === 0 && (
        <p className="text-sm text-slate-400">No images uploaded yet.</p>
      )}

      {!loading && assets.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              canEdit={canEditContent}
              onDeleted={() => setAssets((prev) => prev.filter((a) => a.id !== asset.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

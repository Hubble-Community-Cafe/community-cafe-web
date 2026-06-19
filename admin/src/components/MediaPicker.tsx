import { useRef, useState } from 'react'
import { ImagePlus, X, Upload, Check } from 'lucide-react'
import { fetchAllMedia, uploadMedia, type MediaAsset, type BarLocation } from '../lib/api'

interface MediaPickerProps {
  value: MediaAsset | null
  onChange: (asset: MediaAsset | null) => void
  bar?: BarLocation | null
}

export function MediaPicker({ value, onChange, bar }: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const openPicker = async () => {
    setLoading(true)
    setUploadError(null)
    try {
      setAssets(await fetchAllMedia())
    } finally {
      setLoading(false)
    }
    setOpen(true)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setUploadError(null)
    try {
      const uploaded = await uploadMedia(file, undefined, bar)
      setAssets((prev) => [uploaded, ...prev])
      onChange(uploaded)
      setOpen(false)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const select = (asset: MediaAsset) => {
    onChange(asset)
    setOpen(false)
  }

  return (
    <>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
          <img
            src={value.url}
            alt={value.alt ?? ''}
            className="h-14 w-14 shrink-0 rounded object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-slate-600">{value.filename}</p>
            {value.alt && <p className="truncate text-xs text-slate-400">{value.alt}</p>}
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={openPicker}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              title="Change image"
            >
              <ImagePlus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 hover:border-hubble-400 hover:text-hubble-600"
        >
          <ImagePlus className="h-4 w-4" />
          Choose image
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-800">Choose image</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Upload */}
            <div className="border-b border-slate-100 px-5 py-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleUpload}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 rounded bg-hubble-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading…' : 'Upload new image'}
              </button>
              {uploadError && (
                <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>
              )}
            </div>

            {/* Asset grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading && (
                <p className="text-center text-sm text-slate-400">Loading…</p>
              )}
              {!loading && assets.length === 0 && (
                <p className="text-center text-sm text-slate-400">No images yet. Upload one above.</p>
              )}
              {!loading && assets.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => select(asset)}
                      className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                        value?.id === asset.id
                          ? 'border-hubble-700'
                          : 'border-transparent hover:border-hubble-400'
                      }`}
                    >
                      <img
                        src={asset.url}
                        alt={asset.alt ?? ''}
                        className="h-full w-full object-cover"
                      />
                      {value?.id === asset.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-hubble-700/30">
                          <Check className="h-6 w-6 text-white drop-shadow" />
                        </div>
                      )}
                      {asset.alt && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/50 px-1.5 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100 truncate">
                          {asset.alt}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

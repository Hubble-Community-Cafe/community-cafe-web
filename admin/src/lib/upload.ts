/**
 * Upload limits shared by the media library and the media picker.
 *
 * MAX_UPLOAD_BYTES must stay in step with `spring.servlet.multipart.max-file-size` in the
 * backend's application.properties. The backend still enforces it (and answers 413); this is
 * only so the admin can say something useful before spending a minute uploading a doomed file.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const MAX_UPLOAD_LABEL = '10 MB'

export function formatBytes(n: number | null): string {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Checks a file the user just picked. Returns a message to show them, or null when it is fine.
 */
export function validateUploadFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is ${formatBytes(file.size)}, over the ${MAX_UPLOAD_LABEL} limit. `
      + 'Please resize or compress the image and try again.'
  }
  return null
}

/** What a form accepts as its file, and what to tell the visitor when it is missing or wrong. */
export interface UploadRule {
  /** MIME types as the browser reports them. The backend checks the bytes again. */
  accept: string[]
  maxBytes: number
  missing: string
  wrongType: string
}

/** The receipt on both declaration forms: a PDF or a photo, at most 10 MB. */
export const RECEIPT_UPLOAD: UploadRule = {
  accept: ['application/pdf', 'image/jpeg', 'image/png'],
  maxBytes: 10 * 1024 * 1024,
  missing: 'Please attach the receipt (PDF or image).',
  wrongType: 'Unsupported file type. Attach a PDF or image.',
}

/** The message for a file that breaks `rule`, or null when it is fine. Checked before uploading. */
export function checkUpload(file: File | null, rule: UploadRule): string | null {
  if (!file) return rule.missing
  if (!rule.accept.includes(file.type)) return rule.wrongType
  if (file.size > rule.maxBytes) return `That file is larger than ${rule.maxBytes / (1024 * 1024)} MB.`
  return null
}

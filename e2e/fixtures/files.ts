/** The smallest file the forms accept as a PDF receipt: the backend checks the "%PDF-" header. */
export const MINIMAL_PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF', 'utf8')

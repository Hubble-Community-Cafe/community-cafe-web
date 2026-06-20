import type { APIRequestContext } from '@playwright/test'

/** Mailpit captures the e2e stack's outgoing mail; its HTTP API lets specs assert on it. */
export const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://127.0.0.1:8025'

interface MailListItem {
  ID: string
  To: { Address: string }[]
  From: { Address: string }
  Subject: string
  Attachments: number
}

export interface MailMessage {
  subject: string
  to: string[]
  from: string
  text: string
  attachments: { filename: string; contentType: string }[]
}

/** Delete all captured messages, so each test starts from an empty inbox. */
export async function clearMailpit(request: APIRequestContext): Promise<void> {
  const res = await request.delete(`${MAILPIT_URL}/api/v1/messages`)
  if (!res.ok()) throw new Error(`Mailpit clear failed: ${res.status()}`)
}

/**
 * Poll Mailpit until a message addressed to `recipient` arrives (the SMTP send is async),
 * then return its rendered content + attachment metadata.
 */
export async function waitForMessageTo(
  request: APIRequestContext, recipient: string, timeoutMs = 15000,
): Promise<MailMessage> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const listRes = await request.get(`${MAILPIT_URL}/api/v1/messages?limit=50`)
    if (listRes.ok()) {
      const { messages } = (await listRes.json()) as { messages: MailListItem[] }
      const hit = messages?.find((m) => m.To?.some((t) => t.Address === recipient))
      if (hit) {
        const detailRes = await request.get(`${MAILPIT_URL}/api/v1/message/${hit.ID}`)
        const d = (await detailRes.json()) as {
          Subject: string
          To: { Address: string }[]
          From: { Address: string }
          Text: string
          Attachments: { FileName: string; ContentType: string }[]
        }
        return {
          subject: d.Subject,
          to: d.To.map((t) => t.Address),
          from: d.From.Address,
          text: d.Text ?? '',
          attachments: (d.Attachments ?? []).map((a) => ({
            filename: a.FileName, contentType: a.ContentType,
          })),
        }
      }
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`No message to ${recipient} arrived within ${timeoutMs}ms`)
}

/** Assert no message reached `recipient` within a short window (e.g. a honeypot hit). */
export async function expectNoMessageTo(
  request: APIRequestContext, recipient: string, windowMs = 2000,
): Promise<void> {
  const deadline = Date.now() + windowMs
  while (Date.now() < deadline) {
    const res = await request.get(`${MAILPIT_URL}/api/v1/messages?limit=50`)
    if (res.ok()) {
      const { messages } = (await res.json()) as { messages: MailListItem[] }
      if (messages?.some((m) => m.To?.some((t) => t.Address === recipient))) {
        throw new Error(`Unexpected message delivered to ${recipient}`)
      }
    }
    await new Promise((r) => setTimeout(r, 300))
  }
}

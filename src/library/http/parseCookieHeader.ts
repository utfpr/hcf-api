export function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) {
    return {}
  }

  const cookies: Record<string, string> = {}
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    if (trimmed.length === 0) {
      continue
    }

    const separator = trimmed.indexOf('=')
    if (separator <= 0) {
      continue
    }

    const name = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim()
    try {
      cookies[name] = decodeURIComponent(value)
    } catch {
      cookies[name] = value
    }
  }

  return cookies
}

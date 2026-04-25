export type StreamCheckTone = 'success' | 'warning' | 'error'

export interface StreamCheckUiResult {
  tone: StreamCheckTone
  message: string
  details: string[]
}

interface StreamCheckApiResponse {
  ok?: boolean
  compatibility?: 'compatible' | 'warning' | 'incompatible'
  summary?: string
  details?: {
    status?: number
    contentType?: string
    finalUrl?: string
    protocol?: string
  }
  error?: string
}

export const checkStreamCompatibility = async (streamUrl: string): Promise<StreamCheckUiResult> => {
  const normalized = streamUrl.trim()
  if (!normalized) {
    return {
      tone: 'error',
      message: 'Ingresa una URL de stream antes de probar compatibilidad.',
      details: [],
    }
  }

  let parsed: URL
  try {
    parsed = new URL(normalized)
  } catch {
    return {
      tone: 'error',
      message: 'La URL no tiene un formato valido.',
      details: [],
    }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return {
      tone: 'error',
      message: 'Solo se permiten URLs HTTP o HTTPS.',
      details: [],
    }
  }

  const response = await fetch(`/api/stream-check?url=${encodeURIComponent(normalized)}`)
  const data = (await response.json()) as StreamCheckApiResponse

  if (!response.ok || data.error) {
    return {
      tone: 'error',
      message: data.error || 'No se pudo validar el stream en este momento.',
      details: [],
    }
  }

  const details: string[] = []
  if (data.details?.status) details.push(`HTTP ${data.details.status}`)
  if (data.details?.contentType) details.push(`Formato: ${data.details.contentType}`)
  if (data.details?.protocol) details.push(`Protocolo final: ${data.details.protocol.replace(':', '').toUpperCase()}`)

  if (data.compatibility === 'compatible') {
    return {
      tone: 'success',
      message: data.summary || 'Stream compatible.',
      details,
    }
  }

  if (data.compatibility === 'warning') {
    return {
      tone: 'warning',
      message: data.summary || 'El stream tiene advertencias de compatibilidad.',
      details,
    }
  }

  return {
    tone: 'error',
    message: data.summary || 'El stream no parece compatible.',
    details,
  }
}


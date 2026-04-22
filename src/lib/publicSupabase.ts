const SUPABASE_URL = 'https://jfztzmfywnmitrcsuzca.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmenR6bWZ5d25taXRyY3N1emNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzA5ODYsImV4cCI6MjA4MDc0Njk4Nn0.npXWMVy41SFsOk5h0Sl0BI4ltvX4MLO3bg1yKsfoAT8'

type PublicFilter =
  | { column: string; op: 'eq'; value: string | number | boolean }
  | { column: string; op: 'is'; value: null | string | number | boolean }
  | { column: string; op: 'in'; value: Array<string | number> }

interface PublicQueryOptions {
  select?: string
  filters?: PublicFilter[]
  order?: Array<{ column: string; ascending?: boolean }>
  limit?: number
  range?: { from: number; to: number }
}

const baseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
} as const

const encodeLiteral = (value: string | number | boolean) => {
  if (typeof value === 'string') {
    return `"${value.replace(/"/g, '\\"')}"`
  }

  return String(value)
}

const appendFilter = (searchParams: URLSearchParams, filter: PublicFilter) => {
  if (filter.op === 'eq') {
    searchParams.append(filter.column, `eq.${filter.value}`)
    return
  }

  if (filter.op === 'is') {
    searchParams.append(filter.column, `is.${filter.value === null ? 'null' : filter.value}`)
    return
  }

  const inValues = filter.value.map(encodeLiteral).join(',')
  searchParams.append(filter.column, `in.(${inValues})`)
}

export async function queryPublicTable<T = unknown>(
  table: string,
  options: PublicQueryOptions = {}
): Promise<T[]> {
  const searchParams = new URLSearchParams()
  searchParams.set('select', options.select ?? '*')

  if (options.limit) {
    searchParams.set('limit', String(options.limit))
  }

  if (options.order && options.order.length > 0) {
    const orderValue = options.order
      .map((item) => `${item.column}.${item.ascending === false ? 'desc' : 'asc'}`)
      .join(',')
    searchParams.set('order', orderValue)
  }

  for (const filter of options.filters ?? []) {
    appendFilter(searchParams, filter)
  }

  const headers: HeadersInit = { ...baseHeaders }
  if (options.range) {
    headers.Range = `${options.range.from}-${options.range.to}`
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${searchParams.toString()}`, {
    headers,
  })

  if (!response.ok) {
    throw new Error(`Public query failed (${table}): ${response.status}`)
  }

  return (await response.json()) as T[]
}

export async function fetchAppSettings(keys: string[]) {
  if (keys.length === 0) return {}

  const rows = await queryPublicTable<{ key: string; value: string }>('app_settings', {
    select: 'key,value',
    filters: [{ column: 'key', op: 'in', value: keys }],
  })

  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})
}

import React, { useEffect, useMemo, useState } from 'react'
import { CloudSun, MapPin, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type WeatherCity = {
  id: string
  name: string
  lat: number
  lon: number
}

type CityWeather = {
  cityId: string
  temperature: number
  windSpeed: number
  weatherCode: number
  fetchedAt: string
}

interface WeatherSectionProps {
  className?: string
}

const FORMOSA_CITIES: WeatherCity[] = [
  { id: 'formosa', name: 'Formosa Capital', lat: -26.1775, lon: -58.1781 },
  { id: 'clorinda', name: 'Clorinda', lat: -25.2848, lon: -57.7185 },
  { id: 'pirane', name: 'Pirane', lat: -25.7333, lon: -59.1167 },
  { id: 'el-colorado', name: 'El Colorado', lat: -26.3084, lon: -59.3715 },
  { id: 'ing-juarez', name: 'Ing. Juarez', lat: -23.9033, lon: -61.8508 },
]

const getWeatherLabel = (code: number) => {
  if (code === 0) return 'Despejado'
  if ([1, 2].includes(code)) return 'Algo nublado'
  if (code === 3) return 'Nublado'
  if ([45, 48].includes(code)) return 'Neblina'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Llovizna'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Lluvia'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Nieve'
  if ([95, 96, 99].includes(code)) return 'Tormenta'
  return 'Variable'
}

export const WeatherSection: React.FC<WeatherSectionProps> = ({ className = '' }) => {
  const [items, setItems] = useState<CityWeather[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setError(false)

        const responses = await Promise.all(
          FORMOSA_CITIES.map(async (city) => {
            const url =
              `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
              '&current_weather=true&timezone=America%2FArgentina%2FBuenos_Aires'

            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(`Weather fetch failed for ${city.id}`)
            }

            const payload = await response.json()
            const current = payload?.current_weather

            if (!current) {
              throw new Error(`No current_weather for ${city.id}`)
            }

            return {
              cityId: city.id,
              temperature: Math.round(current.temperature),
              windSpeed: Math.round(current.windspeed),
              weatherCode: Number(current.weathercode ?? -1),
              fetchedAt: String(current.time ?? new Date().toISOString()),
            } satisfies CityWeather
          })
        )

        setItems(responses)
      } catch (fetchError) {
        console.error('Error fetching weather:', fetchError)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    void fetchWeather()
  }, [])

  const weatherByCity = useMemo(() => {
    const map = new Map(items.map((item) => [item.cityId, item]))
    return FORMOSA_CITIES.map((city) => ({
      city,
      weather: map.get(city.id),
    }))
  }, [items])

  if (loading) {
    return (
      <section className={cn('mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900', className)}>
        <div className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      </section>
    )
  }

  return (
    <section className={cn('mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900', className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#566a7f] dark:text-slate-100">
          <CloudSun className="h-5 w-5 text-[#696cff]" />
          <h2 className="text-sm font-black uppercase tracking-wider">Tiempo en Formosa</h2>
        </div>
        {error && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <RefreshCw className="h-3.5 w-3.5" />
            Sin conexion en vivo
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {weatherByCity.map(({ city, weather }) => (
          <article
            key={city.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70"
          >
            <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#697a8d] dark:text-slate-300">
              <MapPin className="h-3.5 w-3.5" />
              {city.name}
            </p>
            {weather ? (
              <>
                <p className="mt-2 text-2xl font-black text-[#566a7f] dark:text-white">{weather.temperature}°</p>
                <p className="text-xs text-[#697a8d] dark:text-slate-300">{getWeatherLabel(weather.weatherCode)}</p>
                <p className="mt-1 text-[11px] text-[#a1acb8] dark:text-slate-400">Viento {weather.windSpeed} km/h</p>
              </>
            ) : (
              <p className="mt-3 text-xs text-[#a1acb8] dark:text-slate-400">Sin datos disponibles</p>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

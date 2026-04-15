import React, { useState } from 'react'
import { Clock, Bell, BellRing } from 'lucide-react'
import { ScheduleItem } from '@/types/database'
import { cn } from '@/lib/utils'
import { useDeviceStore } from '@/stores/deviceStore'

interface ScheduleDisplayProps {
  schedule: ScheduleItem[]
  className?: string
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule, className }) => {
  const [notifiedItems, setNotifiedItems] = useState<Set<string>>(new Set())
  const { isTV } = useDeviceStore()

  const getScheduleByDay = (day: string) => {
    return schedule
      .filter((item) => item.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  const formatTime = (time?: string | null) => {
    if (!time) return '--:--'
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  const handleNotify = async (item: ScheduleItem) => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones.')
      return
    }

    if (Notification.permission === 'granted') {
      toggleNotification(item)
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        toggleNotification(item)
      }
    }
  }

  const toggleNotification = (item: ScheduleItem) => {
    const newSet = new Set(notifiedItems)

    if (newSet.has(item.id)) {
      newSet.delete(item.id)
      alert(`Notificación desactivada para ${item.program_name}`)
    } else {
      newSet.add(item.id)
      alert(`Te avisaremos cuando empiece ${item.program_name}!`)

      new Notification(`Recordatorio activado: ${item.program_name}`, {
        body: `Te avisaremos a las ${item.start_time} los ${item.day_of_week}.`,
      })
    }

    setNotifiedItems(newSet)
  }

  return (
    <div className={cn('bg-white shadow-sm transition-colors dark:bg-gray-800', isTV ? 'rounded-[2rem]' : 'rounded-lg', className)}>
      <div className={cn('border-b border-gray-200 dark:border-gray-700', isTV ? 'px-8 py-6' : 'px-6 py-4')}>
        <h3 className={cn('flex items-center font-semibold text-gray-900 dark:text-white', isTV ? 'text-2xl' : 'text-lg')}>
          <Clock className={cn('mr-2 text-secondary-500', isTV ? 'h-6 w-6' : 'h-5 w-5')} />
          Programación Semanal
        </h3>
      </div>

      <div className={cn(isTV ? 'p-8' : 'p-6')}>
        <div className={cn(isTV ? 'space-y-8' : 'space-y-6')}>
          {daysOfWeek.map((day) => {
            const daySchedule = getScheduleByDay(day)

            if (daySchedule.length === 0) {
              return null
            }

            return (
              <div key={day}>
                <h4 className={cn('mb-3 bg-secondary-50 font-medium text-gray-900 dark:bg-secondary-900/20 dark:text-white', isTV ? 'rounded-2xl px-4 py-3 text-xl' : 'rounded-md px-3 py-2 text-md')}>
                  {day}
                </h4>

                <div className={cn(isTV ? 'space-y-3' : 'space-y-2')}>
                  {daySchedule.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'group flex flex-col items-start justify-between gap-3 bg-gray-50 transition-colors hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700',
                        isTV ? 'rounded-2xl p-5' : 'rounded-md p-3',
                        !isTV && 'sm:flex-row sm:items-center'
                      )}
                    >
                      <div className="flex-1">
                        <h5 className={cn('font-medium text-gray-900 dark:text-white', isTV && 'text-xl')}>
                          {item.program_name}
                        </h5>
                        {item.description && (
                          <p className={cn('mt-1 text-gray-600 dark:text-gray-300', isTV ? 'text-base' : 'text-sm')}>
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className={cn('flex items-start gap-3', isTV ? 'w-full justify-between pt-2' : 'flex-col sm:flex-row sm:items-center')}>
                        <div className={cn('font-medium text-gray-500 dark:text-gray-400', isTV ? 'text-base' : 'text-sm')}>
                          {formatTime(item.start_time)} - {formatTime(item.end_time)}
                        </div>

                        <button
                          onClick={() => handleNotify(item)}
                          className={cn(
                            'focusable rounded-full transition-all',
                            isTV ? 'p-3 opacity-100' : 'p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
                            notifiedItems.has(item.id)
                              ? 'bg-secondary-50 text-secondary-500 dark:bg-secondary-900/30'
                              : 'text-gray-400 hover:bg-gray-200 hover:text-secondary-500 dark:hover:bg-gray-600'
                          )}
                          title="Notificarme"
                        >
                          {notifiedItems.has(item.id) ? (
                            <BellRing className={cn(isTV ? 'h-5 w-5' : 'h-4 w-4')} />
                          ) : (
                            <Bell className={cn(isTV ? 'h-5 w-5' : 'h-4 w-4')} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {schedule.length === 0 && (
            <div className="py-8 text-center">
              <Clock className={cn('mx-auto mb-3 text-gray-300 dark:text-gray-600', isTV ? 'h-16 w-16' : 'h-12 w-12')} />
              <p className={cn('text-gray-500 dark:text-gray-400', isTV && 'text-lg')}>No hay programación disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

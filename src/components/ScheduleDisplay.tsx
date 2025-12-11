import React, { useState } from 'react'
import { Clock, Bell, BellRing } from 'lucide-react'
import { ScheduleItem } from '@/types/database'
import { cn } from '@/lib/utils'

interface ScheduleDisplayProps {
  schedule: ScheduleItem[]
  className?: string
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule, className }) => {
  const [notifiedItems, setNotifiedItems] = useState<Set<string>>(new Set())

  const getScheduleByDay = (day: string) => {
    return schedule
      .filter(item => item.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }
  
  const formatTime = (time: string) => {
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
      // In a real app, this would register a Service Worker push subscription
      // For this demo, we'll simulate a success message
      alert(`¡Te avisaremos cuando empiece ${item.program_name}!`)
      
      // Demo: Send a test notification immediately
      new Notification(`Recordatorio activado: ${item.program_name}`, {
        body: `Te avisaremos a las ${item.start_time} los ${item.day_of_week}.`,
      })
    }
    setNotifiedItems(newSet)
  }
  
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors", className)}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-secondary-500" />
          Programación Semanal
        </h3>
      </div>
      
      <div className="p-6">
        <div className="space-y-6">
          {daysOfWeek.map(day => {
            const daySchedule = getScheduleByDay(day)
            
            if (daySchedule.length === 0) {
              return null
            }
            
            return (
              <div key={day} className="">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 px-3 py-2 bg-secondary-50 dark:bg-secondary-900/20 rounded-md">
                  {day}
                </h4>
                <div className="space-y-2">
                  {daySchedule.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex-1 mr-4">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {item.program_name}
                        </h5>
                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {formatTime(item.start_time)} - {formatTime(item.end_time)}
                        </div>
                        <button
                          onClick={() => handleNotify(item)}
                          className={cn(
                            "p-2 rounded-full transition-all opacity-0 group-hover:opacity-100",
                            notifiedItems.has(item.id) 
                              ? "opacity-100 text-secondary-500 bg-secondary-50 dark:bg-secondary-900/30" 
                              : "text-gray-400 hover:text-secondary-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                          )}
                          title="Notificarme"
                        >
                          {notifiedItems.has(item.id) ? (
                            <BellRing className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
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
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No hay programación disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
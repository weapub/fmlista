import React from 'react'
import { Clock } from 'lucide-react'
import { ScheduleItem } from '@/types/database'
import { cn } from '@/lib/utils'

interface ScheduleDisplayProps {
  schedule: ScheduleItem[]
  className?: string
}

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const ScheduleDisplay: React.FC<ScheduleDisplayProps> = ({ schedule, className }) => {
  const getScheduleByDay = (day: string) => {
    return schedule
      .filter(item => item.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }
  
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-sm transition-colors", className)}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-orange-500" />
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
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                  {day}
                </h4>
                <div className="space-y-2">
                  {daySchedule.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {item.program_name}
                        </h5>
                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {formatTime(item.start_time)} - {formatTime(item.end_time)}
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
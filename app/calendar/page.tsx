"use client"

import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useState } from "react"

interface CalendarEvent {
  id: string
  title: string
  date: Date
  time: string
  duration: number
  color: "primary" | "secondary" | "accent"
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 27))
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Team Standup",
      date: new Date(2025, 9, 27),
      time: "09:00",
      duration: 30,
      color: "primary",
    },
    {
      id: "2",
      title: "Project Review",
      date: new Date(2025, 9, 27),
      time: "14:00",
      duration: 60,
      color: "secondary",
    },
    {
      id: "3",
      title: "Client Call",
      date: new Date(2025, 9, 28),
      time: "10:00",
      duration: 45,
      color: "accent",
    },
  ])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  const getEventsForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return events.filter((e) => e.date.toDateString() === date.toDateString())
  }

  const colorClasses = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    accent: "bg-accent text-accent-foreground",
  }

  return (
    <AppLayout activeModule="calendar">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            New event
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {emptyDays.map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}
                  {days.map((day) => {
                    const dayEvents = getEventsForDate(day)
                    return (
                      <div
                        key={day}
                        className="aspect-square border border-border rounded-lg p-2 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <p className="text-sm font-medium text-foreground mb-1">{day}</p>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs px-2 py-1 rounded truncate ${colorClasses[event.color]}`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <p className="text-xs text-muted-foreground">+{dayEvents.length - 2} more</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 5)
                .map((event) => (
                  <div key={event.id} className="border-l-4 border-primary pl-3 py-2">
                    <p className="font-medium text-sm text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.date.toLocaleDateString()} at {event.time}
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

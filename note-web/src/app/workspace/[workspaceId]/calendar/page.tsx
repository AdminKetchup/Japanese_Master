"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

interface CalendarEvent {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
}

export default function CalendarPage() {
    const params = useParams();
    const workspaceId = params.workspaceId as string;
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Load events from LocalStorage on mount
    useEffect(() => {
        if (!workspaceId) return;
        const savedEvents = localStorage.getItem(`calendar_events_${workspaceId}`);
        if (savedEvents) {
            setEvents(JSON.parse(savedEvents));
        }
    }, [workspaceId]);

    const saveEvents = (newEvents: CalendarEvent[]) => {
        setEvents(newEvents);
        localStorage.setItem(`calendar_events_${workspaceId}`, JSON.stringify(newEvents));
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };
    
    const getEventsForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    };

    const handleAddEvent = (day: number) => {
        const title = window.prompt("Enter event title:");
        if (title) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const newEvent: CalendarEvent = {
                id: Date.now().toString(),
                title,
                date: dateStr
            };
            const newEvents = [...events, newEvent];
            saveEvents(newEvents);
        }
    };

    const handleDeleteEvent = (e: React.MouseEvent, eventId: string) => {
        e.stopPropagation();
        if (confirm("Delete this event?")) {
            const newEvents = events.filter(ev => ev.id !== eventId);
            saveEvents(newEvents);
        }
    };

    return (
        <div className="flex-1 h-screen overflow-y-auto bg-white dark:bg-[#191919] text-gray-900 dark:text-gray-100 transition-colors p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">{monthNames[month]} {year}</h1>
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#2C2C2C] rounded-lg p-1">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 dark:hover:bg-[#3C3C3C] rounded transition">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={handleToday} className="px-3 py-1 text-sm font-medium hover:bg-gray-200 dark:hover:bg-[#3C3C3C] rounded transition">
                            Today
                        </button>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 dark:hover:bg-[#3C3C3C] rounded transition">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-gray-50 dark:bg-[#202020] p-4 text-center font-medium text-gray-500 dark:text-gray-400 text-sm">
                        {day}
                    </div>
                ))}

                {/* Empty Cells */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white dark:bg-[#191919] min-h-[120px]" />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayEvents = getEventsForDay(day);
                    
                    return (
                        <div key={day} className="bg-white dark:bg-[#191919] min-h-[120px] p-2 hover:bg-gray-50 dark:hover:bg-[#202020] transition group relative border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-1">
                            <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday(day) ? 'bg-red-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                {day}
                            </div>
                            
                            {/* Events */}
                            {dayEvents.map(event => (
                                <div key={event.id} className="group/event flex items-center justify-between text-xs p-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
                                    <span className="truncate">{event.title}</span>
                                    <button onClick={(e) => handleDeleteEvent(e, event.id)} className="opacity-0 group-hover/event:opacity-100 hover:text-red-500 transition-opacity">
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            ))}

                            {/* Add Item Button */}
                            <button 
                                onClick={() => handleAddEvent(day)}
                                className="mt-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pt-2"
                            >
                                <Plus size={12} /> Add item
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

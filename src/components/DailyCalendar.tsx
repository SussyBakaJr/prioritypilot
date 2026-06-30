import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';

interface DailyCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
}

export default function DailyCalendar({ selectedDate, onDateChange }: DailyCalendarProps) {
  // Parse selected date
  const parsedDate = React.useMemo(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [selectedDate]);

  // Get start of the week (Monday) for the selected date's week
  const weekDays = React.useMemo(() => {
    const startOfWeek = new Date(parsedDate);
    const day = startOfWeek.getDay();
    // Adjust to Monday. In JS getDay() is 0 for Sunday, 1 for Monday, etc.
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const dateVal = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dateVal}`;

      days.push({
        dateStr,
        dayName: current.toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue...
        dayNum: current.getDate(),
        monthName: current.toLocaleDateString('en-US', { month: 'short' }),
        isToday: new Date().toDateString() === current.toDateString(),
      });
    }
    return days;
  }, [parsedDate]);

  // Handle navigating week-by-week
  const handlePrevWeek = () => {
    const d = new Date(parsedDate);
    d.setDate(d.getDate() - 7);
    formatAndSetDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(parsedDate);
    d.setDate(d.getDate() + 7);
    formatAndSetDate(d);
  };

  const formatAndSetDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateVal = String(d.getDate()).padStart(2, '0');
    onDateChange(`${year}-${month}-${dateVal}`);
  };

  // Get friendly text representation (e.g. Monday, Jun 29)
  const friendlySelectedText = parsedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div id="daily-calendar-wrapper" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-xs space-y-4">
      
      {/* Top Controls: Selector and navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Calendar size={16} />
          </div>
          <div>
            <h2 id="calendar-date-display" className="font-sans font-bold text-slate-900 dark:text-white text-sm md:text-base">
              {friendlySelectedText}
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Select a date to customize specific daily tasks</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick jump to Today */}
          <button
            id="jump-today-btn"
            onClick={() => formatAndSetDate(new Date())}
            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg border border-indigo-150/40 dark:border-indigo-900/30 transition-colors cursor-pointer"
          >
            Today
          </button>

          {/* Date Picker Input */}
          <div className="relative flex items-center">
            <input
              id="calendar-native-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="px-2 py-1 text-[11px] font-medium text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Week View Grid */}
      <div className="flex items-center justify-between gap-2">
        {/* Left Nav */}
        <button
          id="prev-week-btn"
          onClick={handlePrevWeek}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Previous week"
        >
          <ChevronLeft size={16} />
        </button>

        {/* 7 Days of the Week */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-3 flex-1 min-w-0">
          {weekDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            return (
              <button
                key={day.dateStr}
                id={`calendar-day-btn-${day.dateStr}`}
                onClick={() => onDateChange(day.dateStr)}
                className={`flex flex-col items-center p-1 md:p-2 rounded-lg md:rounded-xl border transition-all cursor-pointer min-w-0 ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm scale-[1.03]'
                    : day.isToday
                    ? 'bg-indigo-100/90 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 hover:bg-indigo-200/50'
                    : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100'
                }`}
              >
                <span className={`text-[8px] md:text-[9px] font-extrabold uppercase tracking-wider block truncate ${isSelected ? 'text-indigo-100' : 'text-slate-600 dark:text-slate-300'}`}>
                  {day.dayName}
                </span>
                <span className={`text-xs md:text-sm font-black mt-0.5 md:mt-1 ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-50'}`}>
                  {day.dayNum}
                </span>
                {day.isToday && !isSelected && (
                  <span className="w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full mt-0.5 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Nav */}
        <button
          id="next-week-btn"
          onClick={handleNextWeek}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Next week"
        >
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
}

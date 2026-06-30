import React from 'react';
import { Clock, CheckSquare, Sparkles, Coffee, AlertCircle, PlayCircle, ShieldCheck, Check } from 'lucide-react';
import { ScheduleItem, Task, Subtask } from '../types';

interface DailyScheduleProps {
  schedule: ScheduleItem[];
  tasks: Task[];
  report: { dailyTheme?: string } | null;
  onGenerateSchedule: () => void;
  isLoading: boolean;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  selectedDate?: string;
}

export default function DailySchedule({
  schedule,
  tasks,
  report,
  onGenerateSchedule,
  isLoading,
  onToggleSubtask,
  selectedTaskId,
  onSelectTask,
  selectedDate,
}: DailyScheduleProps) {
  
  // Find task corresponding to selectedTaskId
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const friendlyTitle = React.useMemo(() => {
    if (!selectedDate) return "Today's Schedule";
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedDate === todayStr) return "Today's Schedule";
    
    // Support standard date parsing
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return `Schedule: ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? "Daily Schedule" : `Schedule: ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }, [selectedDate]);

  const getBlockStyles = (type: string, isSelected: boolean) => {
    if (isSelected) {
      return 'border-indigo-500 bg-indigo-50/40 dark:border-indigo-400 dark:bg-indigo-950/20 ring-1 ring-indigo-500';
    }
    switch (type) {
      case 'work':
        return 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900/50';
      case 'break':
        return 'border-emerald-100 bg-emerald-50/30 text-emerald-800 dark:border-emerald-950/30 dark:bg-emerald-950/10 dark:text-emerald-400';
      case 'buffer':
        return 'border-amber-100 bg-amber-50/30 text-amber-800 dark:border-amber-950/30 dark:bg-amber-950/10 dark:text-amber-400';
      default:
        return 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900';
    }
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'work': return <PlayCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />;
      case 'break': return <Coffee className="w-4 h-4 text-emerald-500" />;
      case 'buffer': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div id="daily-schedule-container" className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
      {/* Schedule Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 id="schedule-title" className="font-sans font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            {friendlyTitle}
            {report?.dailyTheme && (
              <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={10} />
                Theme: {report.dailyTheme}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hour-by-hour execution plan crafted by your Coach</p>
        </div>

        {tasks.length > 0 && (
          <button
            id="regenerate-schedule-btn"
            onClick={onGenerateSchedule}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? "Optimizing..." : "Prioritize & Build"}
          </button>
        )}
      </div>

      {/* Main split: Schedule timeline on left, Focus panel (subtasks) on right if task selected */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
        
        {/* Timeline (Left Side) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {schedule.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 py-12">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
                <Sparkles size={22} className="animate-pulse" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No active daily plan</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[280px] mt-1 mb-6">
                Add your tasks on the left, then click below to have the Coach prioritize them, generate subtasks, and schedule your day.
              </p>
              <button
                id="generate-plan-btn"
                onClick={onGenerateSchedule}
                disabled={isLoading || tasks.length === 0}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-indigo-600"
              >
                {isLoading ? (
                  <>Optimizing your day...</>
                ) : (
                  <>
                    <Sparkles size={14} /> Prioritize & Schedule
                  </>
                )}
              </button>
              {tasks.length === 0 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-2">Please create at least one task first!</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {schedule.map((item) => {
                const isSelected = item.taskId ? selectedTaskId === item.taskId : false;
                const associatedTask = item.taskId ? tasks.find(t => t.id === item.taskId) : null;
                const isCompleted = associatedTask?.completed || false;

                return (
                  <div
                    key={item.id}
                    id={`schedule-item-${item.id}`}
                    onClick={() => item.taskId && onSelectTask(isSelected ? null : item.taskId)}
                    className={`flex items-stretch gap-3 p-3.5 rounded-xl border text-sm transition-all ${
                      item.taskId ? 'cursor-pointer' : 'cursor-default'
                    } ${getBlockStyles(item.type, isSelected)}`}
                  >
                    {/* Time Column */}
                    <div className="w-24 flex-shrink-0 flex flex-col justify-center border-r border-slate-100 dark:border-slate-800 pr-3">
                      <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-400 text-center">
                        {item.timeSlot}
                      </span>
                      <span className="text-[10px] text-slate-400 text-center mt-0.5">
                        {item.durationMinutes}m
                      </span>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="mt-0.5 flex-shrink-0">
                          {getBlockIcon(item.type)}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-medium text-xs md:text-sm text-slate-800 dark:text-slate-200 truncate ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                            {item.activity}
                          </p>
                          {associatedTask && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                {associatedTask.category}
                              </span>
                              {associatedTask.subtasks.length > 0 && (
                                <span className="text-[10px] text-slate-400">
                                  ({associatedTask.subtasks.filter(s => s.completed).length}/{associatedTask.subtasks.length} subtasks)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tick off focus indicator if linked to task */}
                      {item.type === 'work' && (
                        <div className="flex-shrink-0 flex items-center gap-1">
                          {isCompleted ? (
                            <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-0.5">
                              <Check size={10} /> Done
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors">
                              View subtasks
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Focus & Subtasks Panel (Right Side, displayed on task click, absolute overlay on mobile) */}
        {selectedTask ? (
          <div className="absolute inset-0 z-20 bg-white dark:bg-slate-900 md:relative md:inset-auto md:z-auto md:w-80 md:bg-slate-100/90 md:dark:bg-slate-900 flex-shrink-0 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-5">
            <div className="h-full flex flex-col justify-between space-y-4 overflow-hidden">
              <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider text-indigo-700 dark:text-indigo-400 uppercase">
                    Focus Mode
                  </span>
                  <button
                    id="close-focus-panel-btn"
                    onClick={() => onSelectTask(null)}
                    className="text-[11px] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50 transition-colors font-bold cursor-pointer"
                  >
                    Close Panel
                  </button>
                </div>

                <div>
                  <h3 className="font-sans font-bold text-sm text-slate-950 dark:text-white leading-snug">
                    {selectedTask.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                      {selectedTask.category}
                    </span>
                    <span className="text-xs text-slate-650 dark:text-slate-400 font-semibold">
                      Est: {selectedTask.duration} mins
                    </span>
                  </div>
                </div>

                {/* Subtask Checklists */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-300">
                    Step-by-Step Subtasks
                  </h4>
                  {selectedTask.subtasks.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic font-medium">No subtasks generated yet. Generate schedule first.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTask.subtasks.map((sub) => (
                        <div
                          key={sub.id}
                          id={`subtask-row-${selectedTask.id}-${sub.id}`}
                          onClick={() => onToggleSubtask(selectedTask.id, sub.id)}
                          className="flex items-center gap-2.5 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs cursor-pointer hover:bg-slate-50/50 transition-colors"
                        >
                          <input
                            id={`subtask-check-${selectedTask.id}-${sub.id}`}
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => {}} // handled by row onClick
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className={`flex-1 text-slate-800 dark:text-slate-200 font-medium truncate ${sub.completed ? 'line-through text-slate-500 dark:text-slate-500' : ''}`}>
                            {sub.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tips block */}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150/40 dark:border-indigo-900/30 rounded-xl">
                <p className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">
                  Pro-Tip
                </p>
                <p className="text-[11px] text-slate-800 dark:text-slate-300 mt-1 font-semibold leading-relaxed">
                  Focus purely on the current subtask. Turn off tabs, and execute. Take a 5 min breather right after.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex w-80 flex-shrink-0 bg-slate-100/90 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-5 flex-col justify-center items-center text-center overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2">
              <CheckSquare size={16} />
            </div>
            <p className="text-xs font-bold text-slate-850 dark:text-slate-200">Task Focus Panel</p>
            <p className="text-[11px] text-slate-650 dark:text-slate-400 mt-1 max-w-[180px] leading-relaxed font-semibold">
              Click on any work schedule slot to open the step-by-step subtask breakdown checklist.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

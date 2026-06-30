import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Clock, AlertTriangle, CheckCircle, Circle, Tag, Sparkles } from 'lucide-react';
import { Task, ImportanceLevel } from '../types';

interface TaskVaultProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed' | 'subtasks' | 'date'>) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string) => void;
  selectedTaskId: string | null;
  onSelectTask: (id: string | null) => void;
}

const CATEGORIES = ['Work', 'Study', 'Personal', 'Health', 'Errand'];
const IMPORTANCE_LEVELS: ImportanceLevel[] = ['High', 'Medium', 'Low'];

export default function TaskVault({
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleComplete,
  selectedTaskId,
  onSelectTask,
}: TaskVaultProps) {
  const [title, setTitle] = useState('');
  const [importance, setImportance] = useState<ImportanceLevel>('Medium');
  const [duration, setDuration] = useState<number>(60); // default 1 hour
  const [category, setCategory] = useState('Work');
  const [deadline, setDeadline] = useState(() => {
    // Default deadline to today at 5:00 PM
    const today = new Date();
    today.setHours(17, 0, 0, 0);
    return today.toISOString().slice(0, 16); // format as YYYY-MM-DDTHH:MM
  });

  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    onAddTask({
      title: title.trim(),
      deadline,
      importance,
      duration: Number(duration),
      category,
    });

    setTitle('');
    setIsAdding(false);
  };

  const getImportanceColor = (level: ImportanceLevel) => {
    switch (level) {
      case 'High': return 'text-red-500 bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50';
      case 'Medium': return 'text-amber-500 bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50';
      case 'Low': return 'text-sky-500 bg-sky-50/50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-900/50';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Work': return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400';
      case 'Study': return 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400';
      case 'Personal': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
      case 'Health': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
      default: return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  const formatDeadline = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="task-vault-container" className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Vault Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 id="task-vault-title" className="font-sans font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            Task Vault
            <span className="text-xs font-normal text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your core inventory of tasks & goals</p>
        </div>
        
        {!isAdding && (
          <button
            id="add-task-btn"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-900/50"
          >
            <Plus size={14} /> Add Task
          </button>
        )}
      </div>

      {/* Adding Task Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} id="task-entry-form" className="p-5 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="space-y-1">
            <label htmlFor="task-title" className="text-xs font-medium text-slate-600 dark:text-slate-400">Task Title</label>
            <input
              id="task-title"
              type="text"
              required
              placeholder="e.g., Finalize presentation deck"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-shadow"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="task-importance" className="text-xs font-medium text-slate-600 dark:text-slate-400">Importance</label>
              <select
                id="task-importance"
                value={importance}
                onChange={(e) => setImportance(e.target.value as ImportanceLevel)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              >
                {IMPORTANCE_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="task-duration" className="text-xs font-medium text-slate-600 dark:text-slate-400">Duration</label>
              <select
                id="task-duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="task-category" className="text-xs font-medium text-slate-600 dark:text-slate-400">Category</label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="task-deadline" className="text-xs font-medium text-slate-600 dark:text-slate-400">Deadline</label>
              <input
                id="task-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              id="cancel-add-task-btn"
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-task-btn"
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Welcome!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] mt-1.5 leading-relaxed">
              Add your first task and let your AI Coach build an optimized schedule for your day.
            </p>
            <button
              id="empty-state-add-task-btn"
              onClick={() => setIsAdding(true)}
              className="mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-95 shadow-xs"
            >
              Create First Task
            </button>
          </div>
        ) : (
          tasks.map(task => {
            const isSelected = selectedTaskId === task.id;
            const completedSubtasks = task.subtasks.filter(s => s.completed).length;
            const totalSubtasks = task.subtasks.length;
            
            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                onClick={() => onSelectTask(isSelected ? null : task.id)}
                className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/20 dark:border-indigo-500/50 dark:bg-indigo-950/10 shadow-sm'
                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/15'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Complete Checkbox */}
                  <button
                    id={`toggle-task-complete-${task.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleComplete(task.id);
                    }}
                    className="mt-0.5 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 fill-indigo-50 dark:fill-indigo-950/30" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  {/* Task Metadata / Title */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-sans font-medium text-sm text-slate-900 dark:text-slate-100 truncate ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                      {task.title}
                    </h3>

                    {/* Meta Details */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-slate-400 dark:text-slate-500">
                      {/* Importance Badge */}
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-medium text-[10px] border ${getImportanceColor(task.importance)}`}>
                        <AlertTriangle size={10} className="mt-[-1px]" />
                        {task.importance}
                      </span>

                      {/* Category Badge */}
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${getCategoryColor(task.category)}`}>
                        <Tag size={10} />
                        {task.category}
                      </span>

                      {/* Duration */}
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDuration(task.duration)}
                      </span>

                      {/* Deadline */}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDeadline(task.deadline)}
                      </span>
                    </div>

                    {/* Subtask Progress indicator */}
                    {totalSubtasks > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                          <span>AI Subtasks Breakdown</span>
                          <span>{completedSubtasks}/{totalSubtasks}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
                          <div
                            className="bg-indigo-600 dark:bg-indigo-400 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delete button (shows on hover) */}
                  <button
                    id={`delete-task-btn-${task.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, CheckSquare, Clock, Zap, LayoutDashboard, BrainCircuit, AlertCircle, RefreshCw, Hourglass, Briefcase } from 'lucide-react';
import { Task, ScheduleItem, CoachingReport, ChatMessage, Subtask } from './types';
import TaskVault from './components/TaskVault';
import DailySchedule from './components/DailySchedule';
import CoachInsights from './components/CoachInsights';
import CoachChat from './components/CoachChat';
import DailyCalendar from './components/DailyCalendar';
import AuthScreen from './components/AuthScreen';
import { auth } from './lib/firebase';
import { 
  saveTaskToDb, 
  deleteTaskFromDb, 
  loadTasksFromDb, 
  saveReportToDb, 
  loadReportFromDb, 
  saveChatHistoryToDb, 
  loadChatHistoryFromDb 
} from './lib/firestoreSync';

const getTodayDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const INITIAL_TASKS: Task[] = [];

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Selected date state
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString);

  // Core domain states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [report, setReport] = useState<CoachingReport | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Listen to Auth State changes
  useEffect(() => {
    const getLocalUser = () => {
      const u = localStorage.getItem('coach_local_user');
      if (u) {
        try { return JSON.parse(u); } catch { return null; }
      }
      return null;
    };

    const localUser = getLocalUser();
    if (localUser) {
      setCurrentUser(localUser);
      setIsAuthChecking(false);
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      const activeLocal = getLocalUser();
      if (activeLocal) {
        setCurrentUser(activeLocal);
      } else if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setIsAuthChecking(false);
    });

    const handleLocalAuthChange = () => {
      const activeLocal = getLocalUser();
      if (activeLocal) {
        setCurrentUser(activeLocal);
      } else {
        setCurrentUser(null);
      }
    };

    window.addEventListener('local-auth-change', handleLocalAuthChange);

    return () => {
      unsubscribe();
      window.removeEventListener('local-auth-change', handleLocalAuthChange);
    };
  }, []);

  // Fetch data from Firestore when user or selectedDate changes
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setReport(null);
      setSchedule([]);
      setChatHistory([]);
      return;
    }

    const loadUserData = async () => {
      setIsDataLoading(true);
      setErrorMessage(null);
      try {
        let dbTasks = await loadTasksFromDb(currentUser.uid, selectedDate);
        const dbReport = await loadReportFromDb(currentUser.uid, selectedDate);
        const dbChat = await loadChatHistoryFromDb(currentUser.uid, selectedDate);

        // Auto-cleanup any old pre-seeded tasks from Firestore to keep the user's workspace pristine
        const seedTitles = [
          'Finalize core design requirements',
          'Review feedback on product slides',
          'Daily run and stretching session',
          'Weekly grocery pickup'
        ];
        const tasksToDelete = dbTasks.filter(t => seedTitles.includes(t.title) || ['t1', 't2', 't3', 't4'].includes(t.id));
        if (tasksToDelete.length > 0) {
          for (const t of tasksToDelete) {
            await deleteTaskFromDb(currentUser.uid, t.id);
          }
          dbTasks = dbTasks.filter(t => !tasksToDelete.some(td => td.id === t.id));
        }

        const isToday = selectedDate === getTodayDateString();
        // If there are no tasks for the selected day AND it is today, seed it for a wonderful onboarding experience
        if (dbTasks.length === 0 && isToday && INITIAL_TASKS.length > 0) {
          const seededTasks = INITIAL_TASKS.map(t => ({ ...t, date: selectedDate }));
          for (const t of seededTasks) {
            await saveTaskToDb(currentUser.uid, t);
          }
          setTasks(seededTasks);
          setReport(null);
          setSchedule([]);
          setChatHistory([]);
        } else {
          setTasks(dbTasks);
          setReport(dbReport);
          setSchedule(dbReport ? dbReport.schedule : []);
          setChatHistory(dbChat);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMessage("Unable to sync database content from secure servers.");
      } finally {
        setIsDataLoading(false);
      }
    };

    loadUserData();
  }, [currentUser, selectedDate]);

  // Keep digital clock updated
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 1. Task Operations
  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'completed' | 'subtasks' | 'date'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      completed: false,
      subtasks: [],
      date: selectedDate,
    };

    // Optimistic state
    setTasks(prev => [newTask, ...prev]);

    if (currentUser) {
      await saveTaskToDb(currentUser.uid, newTask);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSchedule(prev => prev.filter(item => item.taskId !== id));
    if (selectedTaskId === id) setSelectedTaskId(null);

    if (currentUser) {
      await deleteTaskFromDb(currentUser.uid, id);
      
      const updatedSchedule = schedule.filter(item => item.taskId !== id);
      if (report) {
        const nextReport = { ...report, schedule: updatedSchedule };
        setReport(nextReport);
        await saveReportToDb(currentUser.uid, selectedDate, nextReport);
      }
    }
  };

  const handleToggleTaskComplete = async (id: string) => {
    let updatedTask: Task | null = null;
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        const updatedSubtasks = t.subtasks.map(s => ({ ...s, completed: nextCompleted }));
        updatedTask = { ...t, completed: nextCompleted, subtasks: updatedSubtasks };
        return updatedTask;
      }
      return t;
    });

    setTasks(updatedTasks);

    if (currentUser && updatedTask) {
      await saveTaskToDb(currentUser.uid, updatedTask);
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    let updatedTask: Task | null = null;
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(s => {
          if (s.id === subtaskId) return { ...s, completed: !s.completed };
          return s;
        });
        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.completed);
        updatedTask = { ...t, subtasks: updatedSubtasks, completed: allCompleted };
        return updatedTask;
      }
      return t;
    });

    setTasks(updatedTasks);

    if (currentUser && updatedTask) {
      await saveTaskToDb(currentUser.uid, updatedTask);
    }
  };

  // 2. Schedule & Prioritize Generation
  const generateDailySchedule = async () => {
    if (tasks.length === 0) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/coach/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            deadline: t.deadline,
            importance: t.importance,
            duration: t.duration,
            category: t.category,
          })),
          localTime: currentTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server build failed');
      }

      const data = await response.json();
      
      // Map generated subtasks to original tasks list
      const updatedTasks = tasks.map(task => {
        const matchingBreakdown = data.subtaskBreakdowns?.find((b: any) => b.taskId === task.id);
        if (matchingBreakdown) {
          return {
            ...task,
            subtasks: matchingBreakdown.subtasks.map((title: string, index: number) => ({
              id: `sub_${index}`,
              title,
              completed: false,
            })),
          };
        }
        return task;
      });

      // Update priorities based on order in prioritizedTaskIds
      const orderedTasks = updatedTasks.map(t => {
        const priorityIndex = data.prioritizedTaskIds.indexOf(t.id);
        return {
          ...t,
          priority: priorityIndex !== -1 ? priorityIndex + 1 : undefined,
        };
      });

      setTasks(orderedTasks);

      // Create proper schedule items
      const newSchedule: ScheduleItem[] = data.schedule.map((item: any, index: number) => ({
        id: `sched_${index}`,
        timeSlot: item.timeSlot,
        startTime: item.startTime,
        endTime: item.endTime,
        taskId: item.taskId || null,
        activity: item.activity,
        durationMinutes: item.durationMinutes,
        type: item.type as any,
        date: selectedDate,
      }));

      setSchedule(newSchedule);

      // Create Coaching Report
      const newReport: CoachingReport = {
        prioritizedTaskIds: data.prioritizedTaskIds,
        coachingReasoning: data.coachingReasoning,
        welcomeMessage: data.welcomeMessage,
        actionableTips: data.actionableTips,
        dailyTheme: data.dailyTheme,
        schedule: newSchedule,
        date: selectedDate,
      };

      setReport(newReport);

      // Welcome chat message from coach summarizing schedule
      const welcomeMsg: ChatMessage = {
        id: 'msg_initial_' + Date.now(),
        sender: 'coach',
        text: data.welcomeMessage || `Hey there! I've optimized your schedule under the theme: "${data.dailyTheme}". I prioritized your highest impact tasks, built-in rest intervals, and broke each item into actionable steps. Click on any work session to view your subtask checklists! Let me know if you need to adjust anything.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: selectedDate,
      };
      
      const newChat = [welcomeMsg];
      setChatHistory(newChat);

      if (currentUser) {
        for (const t of orderedTasks) {
          await saveTaskToDb(currentUser.uid, t);
        }
        await saveReportToDb(currentUser.uid, selectedDate, newReport);
        await saveChatHistoryToDb(currentUser.uid, selectedDate, newChat);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Unable to generate schedule. Please make sure your Gemini API Key is configured correctly in the Secrets tab.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Chat and Reschedule Actions
  const handleSendChatMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: selectedDate,
    };

    const nextHistory = [...chatHistory, userMsg];
    setChatHistory(nextHistory);
    setChatLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          schedule,
          report,
          chatHistory: nextHistory.slice(-8), // send last 8 messages as context
          userMessage: messageText,
          localTime: currentTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Chat request failed');
      }

      const data = await response.json();

      let nextSchedule = schedule;
      // Update schedule if changed
      if (data.updatedSchedule && data.updatedSchedule.length > 0) {
        nextSchedule = data.updatedSchedule.map((item: any, index: number) => ({
          id: `sched_up_${index}`,
          timeSlot: item.timeSlot,
          startTime: item.startTime,
          endTime: item.endTime,
          taskId: item.taskId || null,
          activity: item.activity,
          durationMinutes: item.durationMinutes,
          type: item.type as any,
          date: selectedDate,
        }));
        setSchedule(nextSchedule);
      }

      // Update task subtasks if changed
      let nextTasks = tasks;
      if (data.updatedTasks && data.updatedTasks.length > 0) {
        nextTasks = tasks.map(task => {
          const match = data.updatedTasks.find((u: any) => u.id === task.id);
          if (match) {
            return {
              ...task,
              subtasks: match.subtasks,
            };
          }
          return task;
        });
        setTasks(nextTasks);
      }

      // Update report if changed
      let nextReport = report;
      if (data.updatedReport) {
        nextReport = report ? {
          ...report,
          dailyTheme: data.updatedReport.dailyTheme || report.dailyTheme,
          coachingReasoning: data.updatedReport.coachingReasoning || report.coachingReasoning,
          actionableTips: data.updatedReport.actionableTips || report.actionableTips,
          schedule: nextSchedule,
        } : {
          prioritizedTaskIds: [],
          coachingReasoning: data.updatedReport.coachingReasoning || '',
          actionableTips: data.updatedReport.actionableTips || [],
          dailyTheme: data.updatedReport.dailyTheme || '',
          schedule: nextSchedule,
          date: selectedDate,
        };
        setReport(nextReport);
      } else if (data.updatedSchedule && data.updatedSchedule.length > 0 && report) {
        nextReport = {
          ...report,
          schedule: nextSchedule,
        };
        setReport(nextReport);
      }

      // Coach's response
      const coachMsg: ChatMessage = {
        id: 'msg_coach_' + Date.now(),
        sender: 'coach',
        text: data.coachReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: selectedDate,
      };

      const finalHistory = [...nextHistory, coachMsg];
      setChatHistory(finalHistory);

      if (currentUser) {
        // Save tasks to Firestore
        if (data.updatedTasks && data.updatedTasks.length > 0) {
          for (const t of nextTasks) {
            await saveTaskToDb(currentUser.uid, t);
          }
        }
        // Save Report
        if (nextReport) {
          await saveReportToDb(currentUser.uid, selectedDate, nextReport);
        }
        // Save Chat History
        await saveChatHistoryToDb(currentUser.uid, selectedDate, finalHistory);
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Chat coach currently offline. Please verify API configurations.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleQuickAction = (actionText: string) => {
    handleSendChatMessage(`I would like to: ${actionText}`);
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetWorkspace = async () => {
    const freshTasks = INITIAL_TASKS.map(t => ({ ...t, date: selectedDate }));
    setTasks(freshTasks);
    setSchedule([]);
    setReport(null);
    setChatHistory([]);
    setSelectedTaskId(null);
    setErrorMessage(null);
    setShowResetConfirm(false);

    if (currentUser) {
      // Clear or rewrite database state for selected day
      // 1. Delete all current tasks
      for (const t of tasks) {
        await deleteTaskFromDb(currentUser.uid, t.id);
      }
      // 2. Set new seeded tasks
      for (const t of freshTasks) {
        await saveTaskToDb(currentUser.uid, t);
      }
      // 3. Delete report and chat history
      await saveReportToDb(currentUser.uid, selectedDate, {
        prioritizedTaskIds: [],
        coachingReasoning: '',
        actionableTips: [],
        dailyTheme: '',
        schedule: [],
        date: selectedDate
      });
      await saveChatHistoryToDb(currentUser.uid, selectedDate, []);
    }
  };

  // Stats calculation
  const totalDuration = tasks.reduce((acc, t) => acc + (t.completed ? 0 : t.duration), 0);
  const completedCount = tasks.filter(t => t.completed).length;

  // Remaining time of the day
  const endOfDay = new Date(currentTime);
  endOfDay.setHours(23, 59, 59, 999);
  const msRemaining = endOfDay.getTime() - currentTime.getTime();
  const minsRemainingInDay = Math.max(0, Math.floor(msRemaining / (1000 * 60)));
  const dayHours = Math.floor(minsRemainingInDay / 60);
  const dayMins = minsRemainingInDay % 60;
  const dayRemainingStr = `${dayHours}h ${dayMins}m`;

  // Remaining time for work
  const workHours = Math.floor(totalDuration / 60);
  const workMins = totalDuration % 60;
  const workRemainingStr = workHours > 0 ? `${workHours}h ${workMins}m` : `${workMins}m`;

  if (isAuthChecking) {
    return (
      <div id="auth-loading-viewport" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center animate-spin">
            <RefreshCw size={22} />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Synchronizing workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50/70 text-slate-800 dark:bg-slate-950 dark:text-slate-200 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Banner & Navigation */}
      <header id="app-header" className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-150 dark:shadow-none">
              <BrainCircuit size={18} />
            </div>
            <div>
              <h1 id="app-logo-text" className="font-sans font-bold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                PriorityPilot
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Prioritize, schedule, and execute with strategic intelligence</p>
            </div>
          </div>

          {/* Real-time stats & controls */}
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3">
            {/* Clock */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
              <Clock size={13} className="text-indigo-600 dark:text-indigo-400" />
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Day Remaining */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
              <Hourglass size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>Day: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{dayRemainingStr}</span></span>
            </div>

            {/* Work Remaining */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
              <Briefcase size={13} className="text-indigo-600 dark:text-indigo-400" />
              <span>Work: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{workRemainingStr}</span></span>
            </div>

            {/* Clear workspace */}
            <button
              id="reset-all-btn"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
            >
              Reset
            </button>

            {/* User display */}
            {currentUser && (
              <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4 ml-2">
                <div className="flex flex-col text-right hidden md:block">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200 block truncate max-w-[120px]">
                    {currentUser.displayName || (currentUser.isAnonymous ? "Guest Coach" : currentUser.email?.split('@')[0])}
                  </span>
                  <span className="text-[9px] text-emerald-500 font-medium">Cloud Synced</span>
                </div>
                <button
                  id="sign-out-btn"
                  onClick={() => {
                    localStorage.removeItem('coach_local_user');
                    auth.signOut();
                    window.dispatchEvent(new Event('local-auth-change'));
                  }}
                  className="text-[10px] font-bold text-slate-800 dark:text-slate-200 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Confirmation Modal */}
      {showResetConfirm && (
        <div id="reset-confirm-modal" className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-xl animate-scale-in">
            <h3 className="font-sans font-bold text-slate-900 dark:text-white text-base">Reset Workspace?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              This will restore the workspace to its default task set and clear your current schedule & active conversation history.
            </p>
            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                id="cancel-reset-btn"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-50 dark:bg-slate-850 dark:hover:bg-slate-750 rounded-xl transition-colors cursor-pointer"
              >
                Keep current
              </button>
              <button
                id="confirm-reset-btn"
                onClick={handleResetWorkspace}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewports */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">

        {/* Global Error Banner */}
        {errorMessage && (
          <div id="error-banner" className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-2xl p-4 flex gap-3 items-start animate-fade-in">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-xs md:text-sm font-semibold text-red-800 dark:text-red-400">Workspace Warning</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Daily Calendar Component */}
        <DailyCalendar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Dynamic Metrics Summary Banner */}
        <div id="metrics-summary-banner" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <CheckSquare size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Tasks Completed</span>
              <span className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                {tasks.length === 0 ? "No tasks yet" : `${completedCount} / ${tasks.length}`}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Estimated Load</span>
              <span className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                {Math.ceil(tasks.reduce((a, b) => a + b.duration, 0) / 60)} hrs
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Status</span>
              <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                {isDataLoading ? (
                  <>
                    <RefreshCw size={11} className="animate-spin text-indigo-500" /> Synching...
                  </>
                ) : (
                  <>✓ Synced</>
                )}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
              <Zap size={16} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Daily Focus</span>
              <span className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                {report ? report.dailyTheme : "Not Built"}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Split & Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Column 1: Task Vault (left 5 columns on desktop) */}
          <div className="lg:col-span-5 h-[620px]">
            <TaskVault
              tasks={tasks}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onToggleComplete={handleToggleTaskComplete}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          </div>

          {/* Column 2: Daily Schedule Timeline (right 7 columns on desktop) */}
          <div className="lg:col-span-7 h-[620px]">
            <DailySchedule
              schedule={schedule}
              tasks={tasks}
              report={report}
              onGenerateSchedule={generateDailySchedule}
              isLoading={isLoading || isDataLoading}
              onToggleSubtask={handleToggleSubtask}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              selectedDate={selectedDate}
            />
          </div>

        </div>

        {/* Row 3: Coach Insights & Workspace Conversations side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left: Strategic Prioritization Reasoning */}
          <div className="lg:col-span-6 h-[460px] flex flex-col">
            <CoachInsights
              report={report}
              isLoading={isLoading || isDataLoading}
            />
          </div>

          {/* Right: Live Interactive Reschedule Conversation */}
          <div className="lg:col-span-6 h-[460px] flex flex-col">
            <CoachChat
              chatHistory={chatHistory}
              onSendMessage={handleSendChatMessage}
              isLoading={chatLoading}
              onQuickAction={handleQuickAction}
            />
          </div>

        </div>

      </main>

      {/* Minimal Aesthetic Footer */}
      <footer id="app-footer" className="mt-auto py-8 border-t border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 text-center">
        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-sans tracking-wide">
          PriorityPilot © 2026. Empowering balanced deep focus and healthy work breaks.
        </p>
      </footer>

    </div>
  );
}

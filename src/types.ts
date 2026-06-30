export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type ImportanceLevel = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO string or simple YYYY-MM-DDTHH:MM
  importance: ImportanceLevel;
  duration: number; // in minutes
  category: string; // Work, Study, Health, Personal, Errand, etc.
  completed: boolean;
  subtasks: Subtask[];
  priority?: number; // 1 = highest, etc.
  date: string; // YYYY-MM-DD representing which day this task belongs to
}

export type ScheduleItemType = 'work' | 'break' | 'buffer';

export interface ScheduleItem {
  id: string;
  timeSlot: string; // e.g. "09:00 - 10:30"
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  taskId: string | null; // null means no specific user task associated (e.g., general break)
  activity: string;
  durationMinutes: number;
  type: ScheduleItemType;
  date: string; // YYYY-MM-DD
}

export interface CoachingReport {
  prioritizedTaskIds: string[];
  coachingReasoning: string;
  welcomeMessage?: string;
  actionableTips: string[];
  dailyTheme: string;
  schedule: ScheduleItem[];
  date: string; // YYYY-MM-DD
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
}

export interface CoachingSession {
  tasks: Task[];
  schedule: ScheduleItem[];
  report: CoachingReport | null;
  chatHistory: ChatMessage[];
}

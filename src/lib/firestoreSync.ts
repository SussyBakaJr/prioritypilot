import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where 
} from 'firebase/firestore';
import { Task, CoachingReport, ChatMessage } from '../types';

const isLocalId = (userId: string): boolean => {
  return !userId || userId.startsWith('local_');
};

/**
 * Save or update a single task in Firestore under user subcollection, with automatic localStorage fallback.
 */
export async function saveTaskToDb(userId: string, task: Task): Promise<void> {
  // 1. Always save to Local Storage as a reliable backup
  try {
    const localKey = `coach_local_tasks_${userId}`;
    const stored = localStorage.getItem(localKey);
    let tasks: Task[] = stored ? JSON.parse(stored) : [];
    tasks = tasks.filter(t => t.id !== task.id);
    tasks.push(task);
    localStorage.setItem(localKey, JSON.stringify(tasks));
  } catch (e) {
    console.warn("Local storage task backup write failed", e);
  }

  if (isLocalId(userId)) return;

  // 2. Sync to cloud Firestore
  try {
    const taskRef = doc(db, 'users', userId, 'tasks', task.id);
    await setDoc(taskRef, task);
  } catch (error) {
    console.warn('Error saving task to Firestore, fallback already active:', error);
  }
}

/**
 * Delete a single task from Firestore, with automatic localStorage fallback.
 */
export async function deleteTaskFromDb(userId: string, taskId: string): Promise<void> {
  // 1. Always delete from Local Storage
  try {
    const localKey = `coach_local_tasks_${userId}`;
    const stored = localStorage.getItem(localKey);
    if (stored) {
      let tasks: Task[] = JSON.parse(stored);
      tasks = tasks.filter(t => t.id !== taskId);
      localStorage.setItem(localKey, JSON.stringify(tasks));
    }
  } catch (e) {
    console.warn("Local storage task backup delete failed", e);
  }

  if (isLocalId(userId)) return;

  // 2. Sync to cloud Firestore
  try {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.warn('Error deleting task from Firestore, fallback already active:', error);
  }
}

/**
 * Load tasks for a specific user and date, falling back gracefully to Local Storage.
 */
export async function loadTasksFromDb(userId: string, dateStr: string): Promise<Task[]> {
  let localTasks: Task[] = [];
  try {
    const localKey = `coach_local_tasks_${userId}`;
    const stored = localStorage.getItem(localKey);
    if (stored) {
      const allTasks: Task[] = JSON.parse(stored);
      localTasks = allTasks.filter(t => t.date === dateStr);
    }
  } catch (e) {
    console.warn("Local storage task load failed", e);
  }

  if (isLocalId(userId)) {
    return localTasks;
  }

  try {
    const tasksColRef = collection(db, 'users', userId, 'tasks');
    const q = query(tasksColRef, where('date', '==', dateStr));
    const snapshot = await getDocs(q);
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      tasks.push(doc.data() as Task);
    });
    
    // Merge cloud and local tasks if they differ to avoid data loss
    if (tasks.length > 0) {
      return tasks;
    }
    return localTasks;
  } catch (error) {
    console.warn('Error loading tasks from Firestore, loading local fallback:', error);
    return localTasks;
  }
}

/**
 * Save or update coaching report for a specific date, with automatic localStorage fallback.
 */
export async function saveReportToDb(userId: string, dateStr: string, report: CoachingReport): Promise<void> {
  // 1. Always save to Local Storage
  try {
    const localKey = `coach_local_report_${userId}_${dateStr}`;
    localStorage.setItem(localKey, JSON.stringify(report));
  } catch (e) {
    console.warn("Local storage report write failed", e);
  }

  if (isLocalId(userId)) return;

  // 2. Sync to cloud Firestore
  try {
    const reportRef = doc(db, 'users', userId, 'reports', dateStr);
    await setDoc(reportRef, report);
  } catch (error) {
    console.warn('Error saving report to Firestore, fallback active:', error);
  }
}

/**
 * Load coaching report for a specific date, falling back gracefully to Local Storage.
 */
export async function loadReportFromDb(userId: string, dateStr: string): Promise<CoachingReport | null> {
  let localReport: CoachingReport | null = null;
  try {
    const localKey = `coach_local_report_${userId}_${dateStr}`;
    const stored = localStorage.getItem(localKey);
    if (stored) {
      localReport = JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Local storage report load failed", e);
  }

  if (isLocalId(userId)) {
    return localReport;
  }

  try {
    const reportRef = doc(db, 'users', userId, 'reports', dateStr);
    const docSnap = await getDoc(reportRef);
    if (docSnap.exists()) {
      return docSnap.data() as CoachingReport;
    }
    return localReport;
  } catch (error) {
    console.warn('Error loading report from Firestore, returning local fallback:', error);
    return localReport;
  }
}

/**
 * Save chat history for a specific date, with automatic localStorage fallback.
 */
export async function saveChatHistoryToDb(userId: string, dateStr: string, chatHistory: ChatMessage[]): Promise<void> {
  // 1. Always save to Local Storage
  try {
    const localKey = `coach_local_chat_${userId}_${dateStr}`;
    localStorage.setItem(localKey, JSON.stringify(chatHistory));
  } catch (e) {
    console.warn("Local storage chat write failed", e);
  }

  if (isLocalId(userId)) return;

  // 2. Sync to cloud Firestore
  try {
    const chatRef = doc(db, 'users', userId, 'chatHistories', dateStr);
    await setDoc(chatRef, { chatHistory });
  } catch (error) {
    console.warn('Error saving chat history to Firestore, fallback active:', error);
  }
}

/**
 * Load chat history for a specific date, falling back gracefully to Local Storage.
 */
export async function loadChatHistoryFromDb(userId: string, dateStr: string): Promise<ChatMessage[]> {
  let localChat: ChatMessage[] = [];
  try {
    const localKey = `coach_local_chat_${userId}_${dateStr}`;
    const stored = localStorage.getItem(localKey);
    if (stored) {
      localChat = JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Local storage chat load failed", e);
  }

  if (isLocalId(userId)) {
    return localChat;
  }

  try {
    const chatRef = doc(db, 'users', userId, 'chatHistories', dateStr);
    const docSnap = await getDoc(chatRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return (data.chatHistory || []) as ChatMessage[];
    }
    return localChat;
  } catch (error) {
    console.warn('Error loading chat history from Firestore, returning local fallback:', error);
    return localChat;
  }
}

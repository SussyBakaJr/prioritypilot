import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini API Client
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please add it in the AI Studio Settings under Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// 1. Prioritize and Schedule Endpoint
app.post("/api/coach/prioritize", async (req, res) => {
  try {
    const { tasks, localTime } = req.body;
    
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "Please provide a non-empty list of tasks to coach on." });
    }

    const ai = getAIClient();

    // System prompt defining the AI Productivity Coach behavior
    const systemInstruction = `You are a world-class AI Productivity Coach & master scheduler. 
Your goal is to help the user conquer their day by prioritizing their tasks, creating a highly realistic hour-by-hour schedule, breaking each task into concrete subtasks, and explaining your logical reasoning with encouraging, high-energy coaching wisdom.

When prioritizing:
1. Assess Urgency (deadlines) vs Importance (levels: High, Medium, Low).
2. Balance deep-work tasks with quick-win errands.
3. Keep the user's workload realistic: a standard work day shouldn't exceed 8 hours of active focus.

When scheduling:
1. Start today's schedule at 9:00 AM (09:00).
2. Structure tasks into solid focus blocks (e.g. 30 to 90 minutes) based on task estimated durations.
3. Insert 10-15 minute rest breaks after major focus sessions.
4. Schedule a 45-60 minute lunch break around 12:00 PM or 1:00 PM.
5. If some tasks cannot fit in today's 8-hour schedule, omit them from the schedule but keep them in prioritizedTaskIds and explain why in your reasoning.

When breaking down tasks:
1. Generate 3 to 5 highly concrete, actionable subtasks for EVERY task provided.
2. Ensure subtasks represent physical or logical progress (e.g., instead of "Plan", use "List 3 core design requirements").

Your tone is supportive, energetic, professional, and clear. Avoid robotic jargon. Give precise productivity advice.`;

    const userPrompt = `Current Local Time: ${localTime || new Date().toISOString()}

Here is the list of tasks to prioritize, break down, and schedule:
${JSON.stringify(tasks, null, 2)}

Please perform the coaching analysis, order the tasks, break each task down into subtasks, generate today's schedule, and provide coaching reasoning and actionable tips.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prioritizedTaskIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of all provided task IDs ordered from highest priority to lowest priority."
            },
            dailyTheme: {
              type: Type.STRING,
              description: "A motivating name or theme for today's schedule, e.g. 'Execution & Flow' or 'Momentum Maker'."
            },
            coachingReasoning: {
              type: Type.STRING,
              description: "A friendly, cohesive paragraph explaining why you prioritized these tasks in this order, how you managed deadlines, and encouraging advice."
            },
            welcomeMessage: {
              type: Type.STRING,
              description: "A highly dynamic, proactive greeting message referencing the count of tasks, their importance, and when they will finish (e.g. 'Good morning! You have 4 important tasks today. I've protected your highest-focus hours and added recovery breaks to prevent burnout. You're on track to finish everything before 4 PM. Let's do this!')."
            },
            actionableTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 highly actionable, contextual productivity tips based on this workload."
            },
            subtaskBreakdowns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.STRING, description: "The exact task ID from the input." },
                  subtasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 to 5 clear, actionable subtask titles."
                  }
                },
                required: ["taskId", "subtasks"]
              },
              description: "A subtask breakdown list containing every single task ID provided."
            },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeSlot: { type: Type.STRING, description: "e.g., '09:00 - 10:30'" },
                  startTime: { type: Type.STRING, description: "e.g., '09:00'" },
                  endTime: { type: Type.STRING, description: "e.g., '10:30'" },
                  taskId: { type: Type.STRING, description: "The task ID scheduled, or an empty string '' if it is a break/buffer." },
                  activity: { type: Type.STRING, description: "The description of what to do (e.g., 'Focus on writing slides' or 'Lunch and walk')." },
                  durationMinutes: { type: Type.INTEGER, description: "Duration of this block in minutes." },
                  type: { type: Type.STRING, description: "Must be: 'work', 'break', or 'buffer'." }
                },
                required: ["timeSlot", "startTime", "endTime", "taskId", "activity", "durationMinutes", "type"]
              },
              description: "An hour-by-hour schedule starting from 9:00 AM (09:00) with realistic focus blocks, rest breaks, and lunch."
            }
          },
          required: ["prioritizedTaskIds", "dailyTheme", "coachingReasoning", "welcomeMessage", "actionableTips", "subtaskBreakdowns", "schedule"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI model.");
    }

    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Prioritize Endpoint Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during coaching generation." });
  }
});

// 2. Chat and Reschedule Endpoint
app.post("/api/coach/chat", async (req, res) => {
  try {
    const { tasks, schedule, report, chatHistory, userMessage, localTime } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: "Please provide a message for the AI Coach." });
    }

    const ai = getAIClient();

    const systemInstruction = `You are a world-class AI Productivity Coach & master scheduler.
The user is conversing with you about their daily plan, tasks, and schedule.
You must:
1. Answer their question or request in a highly supportive, practical, and motivating coaching tone.
2. If they request a schedule change (e.g., 'I want to sleep in', 'I have a meeting at 2 PM', 'reschedule my personal tasks', 'make breaks longer'), reschedule or adjust the schedule accordingly. Return the updated schedule in updatedSchedule.
3. If they request to add or detail subtasks, or if a task changes, return the updated task list with subtasks in updatedTasks.
4. If they just asked a general question or asked for advice, you can leave updatedSchedule and updatedTasks as they were, but still provide your conversational 'coachReply'.
5. Always preserve task IDs! If you adjust schedules or subtasks, make sure the task IDs correspond exactly to the original IDs.

Maintain an encouraging, dynamic, and action-oriented tone. Keep replies concise and easy to read.`;

    const coachPrompt = `Current Local Time: ${localTime || new Date().toISOString()}

Current Active Tasks:
${JSON.stringify(tasks, null, 2)}

Current Daily Schedule:
${JSON.stringify(schedule, null, 2)}

Current Coaching Report & Metadata:
${JSON.stringify(report, null, 2)}

Chat History:
${JSON.stringify(chatHistory, null, 2)}

User's Latest Message: "${userMessage}"

Please respond to the user's latest message. Return your conversational response, and updated schedule/tasks if they requested adjustments.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: coachPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coachReply: {
              type: Type.STRING,
              description: "Your friendly, supportive conversational reply as the AI Productivity Coach. Speak directly to the user's request, explaining any schedule adjustments made."
            },
            updatedSchedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeSlot: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  taskId: { type: Type.STRING, description: "The task ID, or an empty string '' if break/buffer." },
                  activity: { type: Type.STRING },
                  durationMinutes: { type: Type.INTEGER },
                  type: { type: Type.STRING }
                },
                required: ["timeSlot", "startTime", "endTime", "taskId", "activity", "durationMinutes", "type"]
              },
              description: "The complete updated schedule. If no schedule change was requested, return the current schedule unchanged."
            },
            updatedTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  subtasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        completed: { type: Type.BOOLEAN }
                      },
                      required: ["id", "title", "completed"]
                    }
                  }
                },
                required: ["id", "subtasks"]
              },
              description: "An array of task IDs and their list of subtasks if any adjustments or new subtasks were made. If unchanged, return the current tasks list unchanged."
            },
            updatedReport: {
              type: Type.OBJECT,
              properties: {
                dailyTheme: { type: Type.STRING },
                coachingReasoning: { type: Type.STRING },
                actionableTips: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              description: "Any updates to the overall daily theme, reasoning, or tips, if relevant. Omit or leave empty if unchanged."
            }
          },
          required: ["coachReply", "updatedSchedule", "updatedTasks"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI Coach.");
    }

    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Chat Endpoint Error:", error);
    res.status(500).json({ error: error.message || "An error occurred during chat coaching." });
  }
});

// Setup Vite dev server or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Productivity Coach server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();

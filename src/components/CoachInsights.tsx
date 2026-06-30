import React from 'react';
import { Sparkles, Compass, Lightbulb, CheckCircle2 } from 'lucide-react';
import { CoachingReport } from '../types';

interface CoachInsightsProps {
  report: CoachingReport | null;
  isLoading: boolean;
}

export default function CoachInsights({ report, isLoading }: CoachInsightsProps) {
  if (isLoading) {
    return (
      <div id="coach-insights-loading" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full animate-ping" />
          <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-1/3 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full animate-pulse" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-4/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div id="coach-insights-empty" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center justify-center text-center py-10">
        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
          <Compass size={18} />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Coaching Strategy Awaiting</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[280px] mt-1">
          Once your plan is generated, your AI Coach's strategic reasoning and personalized tips will appear here.
        </p>
      </div>
    );
  }

  return (
    <div id="coach-insights-container" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm h-full flex flex-col overflow-hidden">
      {/* Title & Theme */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h2 className="font-sans font-semibold text-base text-slate-900 dark:text-white">Coach's Strategy</h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Today's Vibe</span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{report.dailyTheme}</span>
        </div>
      </div>

      {/* Scrollable Content wrapper */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-5 pt-4">
        {/* Logical Reasoning */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass size={12} className="text-indigo-500" />
            Prioritization Logic
          </h3>
          <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans font-normal">
            {report.coachingReasoning}
          </p>
        </div>

        {/* Actionable Tips */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb size={12} className="text-amber-500" />
            Coach's Key Tactics
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {report.actionableTips.map((tip, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/45 rounded-xl border border-slate-200/40 dark:border-slate-800/40 flex gap-2.5 items-start">
                <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

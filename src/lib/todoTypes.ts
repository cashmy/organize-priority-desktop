export type Priority = 'high' | 'medium' | 'low';
export type DOW = 'M' | 'T' | 'W' | 'Th' | 'F' | 'Sa' | 'Su';

export const ALL_DOW: DOW[] = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'];

export const DOW_LABELS: Record<DOW, string> = {
  M: 'Monday',
  T: 'Tuesday',
  W: 'Wednesday',
  Th: 'Thursday',
  F: 'Friday',
  Sa: 'Saturday',
  Su: 'Sunday',
};

export interface Category {
  id: string;
  name: string;
  color: string; // tailwind-friendly hex
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  categoryId: string;
  priority: Priority;
  dow: DOW[];
  completed: boolean;
  createdAt: number;
  order: number;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', color: '#6366f1' },
  { id: 'personal', name: 'Personal', color: '#10b981' },
  { id: 'shopping', name: 'Shopping', color: '#f59e0b' },
  { id: 'health', name: 'Health', color: '#ef4444' },
  { id: 'projects', name: 'Projects', color: '#8b5cf6' },
  { id: 'home', name: 'Home', color: '#14b8a6' },
  { id: 'learning', name: 'Learning', color: '#0ea5e9' },
];

export const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const PRIORITY_STYLES: Record<Priority, { dot: string; badge: string; label: string }> = {
  high: {
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    label: 'High',
  },
  medium: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Medium',
  },
  low: {
    dot: 'bg-slate-400',
    badge: 'bg-slate-50 text-slate-600 border-slate-200',
    label: 'Low',
  },
};

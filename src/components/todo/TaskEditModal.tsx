import React, { useEffect, useState } from 'react';
import { Task, Category, Priority, DOW, ALL_DOW } from '@/lib/todoTypes';
import { X } from 'lucide-react';

interface Props {
  task: Task | null;
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

const TaskEditModal: React.FC<Props> = ({ task, categories, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [categoryId, setCategoryId] = useState('');
  const [dow, setDow] = useState<DOW[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? '');
      setPriority(task.priority);
      setCategoryId(task.categoryId);
      setDow(task.dow);
    }
  }, [task]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && task) onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [task, onClose]);

  if (!task) return null;

  const save = () => {
    if (!title.trim()) return;
    onSave(task.id, {
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
      categoryId,
      dow,
    });
    onClose();
  };

  const toggleDow = (d: DOW) =>
    setDow((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-400 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-400 bg-white"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 mb-2 block">
              Days of Week (optional)
            </label>
            <div className="flex gap-1.5">
              {ALL_DOW.map((d) => {
                const active = dow.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDow(d)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any details..."
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => {
              if (confirm('Delete this task?')) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium"
          >
            Delete Task
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!title.trim()}
              className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-40"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskEditModal;

import React, { useState } from 'react';
import { Priority, DOW, ALL_DOW, PRIORITY_STYLES } from '@/lib/todoTypes';
import { Plus } from 'lucide-react';

interface Props {
  categoryId: string;
  defaultPriority?: Priority;
  onAdd: (data: { title: string; priority: Priority; dow: DOW[]; categoryId: string }) => void;
}

const QuickAdd: React.FC<Props> = ({ categoryId, defaultPriority = 'medium', onAdd }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [dow, setDow] = useState<DOW[]>([]);
  const [expanded, setExpanded] = useState(false);

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title: title.trim(), priority, dow, categoryId });
    setTitle('');
    setDow([]);
    setPriority(defaultPriority);
    setExpanded(false);
  };

  const toggleDow = (d: DOW) =>
    setDow((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <div
      className={`rounded-lg border bg-white transition ${
        expanded ? 'border-indigo-300 shadow-sm' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <Plus className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') {
              setExpanded(false);
              setTitle('');
            }
          }}
          placeholder="Add a task... (Enter to save)"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        {(expanded || title) && (
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white outline-none focus:border-indigo-400"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        )}
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-1 flex items-center gap-2 flex-wrap border-t border-slate-100">
          <span className="text-[11px] text-slate-500 mr-1">Days:</span>
          {ALL_DOW.map((d) => {
            const active = dow.includes(d);
            return (
              <button
                key={d}
                onClick={() => toggleDow(d)}
                className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d}
              </button>
            );
          })}
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => {
                setExpanded(false);
                setTitle('');
                setDow([]);
              }}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!title.trim()}
              className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickAdd;

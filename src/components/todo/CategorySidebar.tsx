import React, { useState } from 'react';
import { Category, Task, ALL_DOW, DOW, DOW_LABELS } from '@/lib/todoTypes';
import { Plus, Trash2, Edit2, Check, X, ListTodo, CalendarDays, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  categories: Category[];
  tasks: Task[];
  selectedView: string; // 'all' | 'today' | DOW string | category id
  onSelectView: (v: string) => void;
  onAddCategory: (name: string, color: string) => void;
  onUpdateCategory: (id: string, patch: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
}

const COLOR_PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#14b8a6', '#0ea5e9', '#ec4899', '#f97316', '#84cc16',
];

const todayDow = (): DOW => {
  const map: DOW[] = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
  return map[new Date().getDay()];
};

const CategorySidebar: React.FC<Props> = ({
  categories,
  tasks,
  selectedView,
  onSelectView,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const countFor = (catId: string) =>
    tasks.filter((t) => t.categoryId === catId && !t.completed).length;

  const totalOpen = tasks.filter((t) => !t.completed).length;
  const today = todayDow();
  const todayCount = tasks.filter(
    (t) => !t.completed && t.dow.includes(today)
  ).length;

  const submitNew = () => {
    if (!newName.trim()) return;
    onAddCategory(newName, newColor);
    setNewName('');
    setNewColor(COLOR_PALETTE[0]);
    setAdding(false);
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const submitEdit = (id: string) => {
    if (editName.trim()) onUpdateCategory(id, { name: editName.trim() });
    setEditingId(null);
  };

  return (
    <aside className="w-72 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <ListTodo className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">Tasker</h1>
            <p className="text-[11px] text-slate-500">Personal task workspace</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1 mb-5">
          <SidebarItem
            icon={<Inbox className="w-4 h-4" />}
            label="All Tasks"
            count={totalOpen}
            active={selectedView === 'all'}
            onClick={() => onSelectView('all')}
          />
          <SidebarItem
            icon={<CalendarDays className="w-4 h-4" />}
            label={`Today (${DOW_LABELS[today].slice(0, 3)})`}
            count={todayCount}
            active={selectedView === 'today'}
            onClick={() => onSelectView('today')}
          />
        </div>

        <div className="px-2 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Categories
          </span>
          <button
            onClick={() => setAdding((v) => !v)}
            className="text-slate-400 hover:text-slate-700 transition"
            aria-label="Add category"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {adding && (
          <div className="mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNew();
                if (e.key === 'Escape') setAdding(false);
              }}
              placeholder="Category name"
              className="h-8 text-sm"
            />
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-5 h-5 rounded-full transition ${
                    newColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" className="h-7 flex-1" onClick={submitNew}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7"
                onClick={() => setAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-0.5 mb-5">
          {categories.map((c) => (
            <div key={c.id} className="group">
              {editingId === c.id ? (
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitEdit(c.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="h-7 text-sm flex-1"
                  />
                  <button
                    onClick={() => submitEdit(c.id)}
                    className="p-1 text-slate-500 hover:text-emerald-600"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onSelectView(c.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition ${
                    selectedView === c.id
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="flex-1 text-left truncate">{c.name}</span>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {countFor(c.id)}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 ml-1">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(c);
                      }}
                      className="p-0.5 hover:text-indigo-600 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${c.name}" and all its tasks?`)) {
                          onDeleteCategory(c.id);
                        }
                      }}
                      className="p-0.5 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </span>
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="px-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Filter by Day
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1 px-2">
          {ALL_DOW.map((d) => {
            const active = selectedView === `dow:${d}`;
            const count = tasks.filter(
              (t) => !t.completed && t.dow.includes(d)
            ).length;
            return (
              <button
                key={d}
                onClick={() =>
                  onSelectView(active ? 'all' : `dow:${d}`)
                }
                title={`${DOW_LABELS[d]} (${count})`}
                className={`relative aspect-square rounded-md text-[11px] font-medium transition ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {d}
                {count > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center ${
                      active ? 'bg-white text-indigo-700' : 'bg-indigo-500 text-white'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400">
        Local-first · {tasks.length} total tasks
      </div>
    </aside>
  );
};

const SidebarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition ${
      active
        ? 'bg-indigo-50 text-indigo-700 font-medium'
        : 'text-slate-700 hover:bg-slate-50'
    }`}
  >
    {icon}
    <span className="flex-1 text-left">{label}</span>
    <span className="text-xs text-slate-400 tabular-nums">{count}</span>
  </button>
);

export default CategorySidebar;

import React from "react";
import { Category, Task, PRIORITY_RANK, Priority, DOW } from "@/lib/todoTypes";
import TaskCard from "./TaskCard";
import QuickAdd from "./QuickAdd";
import { ChevronDown } from "lucide-react";

interface Props {
  category: Category;
  tasks: Task[];
  collapsed: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onToggleCollapsed: (id: string) => void;
  onAddTask: (data: {
    title: string;
    priority: Priority;
    dow: DOW[];
    categoryId: string;
  }) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Task) => void;
  onTaskDragStart: (taskId: string, categoryId: string) => void;
  onTaskDragEnd: () => void;
  onCategoryDragOver: (targetCategoryId: string) => void;
  onTaskDrop: (targetCategoryId: string, toId: string) => void;
  onCategoryDrop: (targetCategoryId: string) => void;
  showQuickAdd?: boolean;
}

const CategoryGroup: React.FC<Props> = ({
  category,
  tasks,
  collapsed,
  isDragging,
  isDropTarget,
  onToggleCollapsed,
  onAddTask,
  onToggle,
  onDelete,
  onEdit,
  onTaskDragStart,
  onTaskDragEnd,
  onCategoryDragOver,
  onTaskDrop,
  onCategoryDrop,
  showQuickAdd = true,
}) => {
  const sorted = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pr !== 0) return pr;
    return a.order - b.order;
  });

  const open = sorted.filter((t) => !t.completed).length;
  const total = sorted.length;
  const showDropState = isDragging && isDropTarget;

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault();
        onCategoryDragOver(category.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onCategoryDrop(category.id);
      }}
      className={`mb-7 rounded-xl transition-all ${
        showDropState ? "bg-indigo-50/70 ring-1 ring-indigo-200 shadow-sm" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-3 group">
        <button
          onClick={() => onToggleCollapsed(category.id)}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition"
        >
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              collapsed ? "-rotate-90" : ""
            }`}
          />
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <h2 className="text-sm font-semibold tracking-tight">
            {category.name}
          </h2>
        </button>
        <span className="text-xs text-slate-400 tabular-nums">
          {open} open · {total} total
        </span>
        <div
          className="flex-1 h-px ml-2"
          style={{
            background: `linear-gradient(to right, ${category.color}30, transparent)`,
          }}
        />
      </div>

      {!collapsed && (
        <div className="space-y-2 pl-6">
          {showQuickAdd && (
            <QuickAdd categoryId={category.id} onAdd={onAddTask} />
          )}
          {sorted.length === 0 && !showQuickAdd && (
            <p className="text-xs text-slate-400 italic px-1 py-2">
              No tasks in this category yet.
            </p>
          )}
          {sorted.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              category={category}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onDragStart={(id) => onTaskDragStart(id, category.id)}
              onDragEnd={onTaskDragEnd}
              onDragOver={(e) => {
                e.preventDefault();
                onCategoryDragOver(category.id);
              }}
              onDrop={(e, toId) => {
                e.preventDefault();
                e.stopPropagation();
                onTaskDrop(category.id, toId);
              }}
            />
          ))}
          {sorted.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                onCategoryDragOver(category.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCategoryDrop(category.id);
              }}
              className={`rounded-lg border border-dashed px-3 py-4 text-xs transition ${
                showDropState
                  ? "border-indigo-300 bg-indigo-100 text-indigo-700"
                  : "border-slate-200 bg-slate-50/70 text-slate-400"
              }`}
            >
              Drop a task here
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                onCategoryDragOver(category.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCategoryDrop(category.id);
              }}
              className={`h-3 rounded-md transition ${
                showDropState ? "bg-indigo-100/80" : ""
              }`}
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </section>
  );
};

export default CategoryGroup;

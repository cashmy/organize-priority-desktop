import React, { useState } from "react";
import { Task, Category, PRIORITY_STYLES } from "@/lib/todoTypes";
import { Check, Trash2, Edit3, GripVertical, StickyNote } from "lucide-react";

interface Props {
  task: Task;
  category?: Category;
  showCategory?: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (e: React.DragEvent, toId: string) => void;
}

const TaskCard: React.FC<Props> = ({
  task,
  category,
  showCategory,
  onToggle,
  onDelete,
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) => {
  const [hover, setHover] = useState(false);
  const pStyle = PRIORITY_STYLES[task.priority];

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart?.(task.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      onDragOver={(e) => onDragOver?.(e, task.id)}
      onDrop={(e) => onDrop?.(e, task.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`group flex items-start gap-3 rounded-lg border bg-white px-3 py-2.5 transition ${
        task.completed
          ? "border-slate-100 opacity-60"
          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <span
        className={`mt-0.5 cursor-grab text-slate-300 hover:text-slate-500 transition ${
          hover ? "opacity-100" : "opacity-0"
        }`}
      >
        <GripVertical className="w-4 h-4" />
      </span>

      <button
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition ${
          task.completed
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "border-slate-300 hover:border-indigo-500 bg-white"
        }`}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        {task.completed && <Check className="w-3 h-3" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`w-1.5 h-1.5 rounded-full ${pStyle.dot}`} />
          <span
            className={`text-sm ${
              task.completed
                ? "line-through text-slate-400"
                : "text-slate-800 font-medium"
            }`}
          >
            {task.title}
          </span>
          {task.notes && <StickyNote className="w-3 h-3 text-amber-500" />}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${pStyle.badge}`}
          >
            {pStyle.label}
          </span>
          {showCategory && category && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: `${category.color}15`,
                color: category.color,
              }}
            >
              {category.name}
            </span>
          )}
          {task.dow.length > 0 && (
            <div className="flex items-center gap-0.5">
              {task.dow.map((d) => (
                <span
                  key={d}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                >
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className={`flex items-center gap-0.5 transition ${hover ? "opacity-100" : "opacity-0"}`}
      >
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition"
          aria-label="Edit"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded transition"
          aria-label="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default TaskCard;

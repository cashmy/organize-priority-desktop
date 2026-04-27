import React, { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useTodos } from "@/hooks/useTodos";
import { useAuth } from "@/contexts/AuthContext";
import { Task, DOW, PRIORITY_RANK } from "@/lib/todoTypes";
import {
  getHeaderInfoForView,
  getTodayDow,
  isCategoryView,
} from "@/lib/taskViews";
import CategorySidebar from "./todo/CategorySidebar";
import CategoryGroup from "./todo/CategoryGroup";
import TaskCard from "./todo/TaskCard";
import TaskEditModal from "./todo/TaskEditModal";
import AuthModal from "./auth/AuthModal";
import {
  Search,
  CheckCircle2,
  Circle,
  Keyboard,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  LogIn,
  User as UserIcon,
} from "lucide-react";

const AppLayout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    categories,
    tasks,
    collapsed,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    reorderInCategory,
    moveTaskToCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleCollapsed,
    online,
    syncing,
    lastSyncedAt,
    isAuthenticated,
    refresh,
  } = useTodos();
  const { user, signOut } = useAuth();

  const [view, setView] = useState<string>(
    () => searchParams.get("view") ?? "all",
  ); // all | today | dow:X | category id
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [showCompleted, setShowCompleted] = useState(
    () => searchParams.get("done") === "1",
  );
  const [editing, setEditing] = useState<Task | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [draggedTask, setDraggedTask] = useState<{
    id: string;
    categoryId: string;
  } | null>(null);
  const [dropTargetCategoryId, setDropTargetCategoryId] = useState<
    string | null
  >(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const el = document.getElementById(
          "global-search",
        ) as HTMLInputElement | null;
        el?.focus();
      }
      if (
        e.key === "?" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setShowShortcuts((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const todayDow = useMemo<DOW>(() => getTodayDow(), []);

  const filteredTasks = useMemo(() => {
    let out = tasks;
    if (!showCompleted) out = out.filter((t) => !t.completed);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes ?? "").toLowerCase().includes(q),
      );
    }
    if (view === "today") {
      out = out.filter((t) => t.dow.includes(todayDow));
    } else if (view.startsWith("dow:")) {
      const d = view.slice(4) as DOW;
      out = out.filter((t) => t.dow.includes(d));
    } else if (view !== "all") {
      out = out.filter((t) => t.categoryId === view);
    }
    return out;
  }, [tasks, view, search, showCompleted, todayDow]);

  // Stats
  const stats = useMemo(() => {
    const open = tasks.filter((t) => !t.completed).length;
    const done = tasks.filter((t) => t.completed).length;
    const todayOpen = tasks.filter(
      (t) => !t.completed && t.dow.includes(todayDow),
    ).length;
    const high = tasks.filter(
      (t) => !t.completed && t.priority === "high",
    ).length;
    return { open, done, todayOpen, high };
  }, [tasks, todayDow]);

  const headerInfo = useMemo(
    () => getHeaderInfoForView(view, todayDow, categories),
    [view, todayDow, categories],
  );

  const currentViewIsCategory = isCategoryView(view);

  const openReportView = () => {
    const params = new URLSearchParams({
      view,
      search,
      done: showCompleted ? "1" : "0",
    });

    window.open(`/report?${params.toString()}`, "task-report-preview")?.focus();
  };

  const handleTaskDragStart = (taskId: string, categoryId: string) => {
    setDraggedTask({ id: taskId, categoryId });
  };

  const handleCategoryDragOver = (targetCategoryId: string) => {
    if (!draggedTask) return;
    setDropTargetCategoryId((current) =>
      current === targetCategoryId ? current : targetCategoryId,
    );
  };

  const clearDraggedTask = () => {
    setDraggedTask(null);
    setDropTargetCategoryId(null);
  };

  const handleTaskDrop = (targetCategoryId: string, toId: string) => {
    if (!draggedTask || draggedTask.id === toId) {
      setDraggedTask(null);
      return;
    }

    if (draggedTask.categoryId === targetCategoryId) {
      reorderInCategory(targetCategoryId, draggedTask.id, toId);
    } else {
      moveTaskToCategory(draggedTask.id, targetCategoryId, toId);
    }

    setDraggedTask(null);
    setDropTargetCategoryId(null);
  };

  const handleCategoryDrop = (targetCategoryId: string) => {
    if (!draggedTask) return;

    if (draggedTask.categoryId !== targetCategoryId) {
      moveTaskToCategory(draggedTask.id, targetCategoryId);
    }

    setDraggedTask(null);
    setDropTargetCategoryId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <CategorySidebar
        categories={categories}
        tasks={tasks}
        selectedView={view}
        onSelectView={setView}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
      />

      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur border-b border-slate-200 px-8 py-4">
          <div className="flex items-center gap-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              {headerInfo.color && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: headerInfo.color }}
                />
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight truncate">
                  {headerInfo.title}
                </h1>
                <p className="text-xs text-slate-500">{headerInfo.subtitle}</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="global-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-64 pl-9 pr-12 py-2 text-sm bg-white border border-slate-200 rounded-md outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">
                  ⌘K
                </kbd>
              </div>
              <button
                onClick={() => setShowCompleted((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md border transition ${
                  showCompleted
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {showCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                {showCompleted ? "Hide done" : "Show done"}
              </button>
              <button
                onClick={openReportView}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                title="Open a printable report for the current view"
              >
                <FileText className="h-3.5 w-3.5" />
                Report
              </button>
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition border border-transparent hover:border-slate-200"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="w-4 h-4" />
              </button>

              <SyncIndicator
                online={online}
                syncing={syncing}
                isAuthenticated={isAuthenticated}
                lastSyncedAt={lastSyncedAt}
                onRefresh={refresh}
              />

              {isAuthenticated ? (
                <UserMenu
                  email={user?.email ?? ""}
                  onSignOut={async () => {
                    await signOut();
                  }}
                />
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Stats strip */}
        <div className="px-8 pt-6">
          <div className="max-w-6xl mx-auto grid grid-cols-4 gap-3">
            <StatCard
              label="Open Tasks"
              value={stats.open}
              accent="bg-indigo-50 text-indigo-700"
            />
            <StatCard
              label="Today"
              value={stats.todayOpen}
              accent="bg-sky-50 text-sky-700"
            />
            <StatCard
              label="High Priority"
              value={stats.high}
              accent="bg-rose-50 text-rose-700"
            />
            <StatCard
              label="Completed"
              value={stats.done}
              accent="bg-emerald-50 text-emerald-700"
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 max-w-6xl mx-auto">
          {currentViewIsCategory ? (
            <CategoryView
              categoryId={view}
              categories={categories}
              tasks={filteredTasks}
              collapsed={collapsed}
              isDragging={!!draggedTask}
              dropTargetCategoryId={dropTargetCategoryId}
              onToggleCollapsed={toggleCollapsed}
              onAddTask={addTask}
              onToggle={toggleComplete}
              onDelete={deleteTask}
              onEdit={setEditing}
              onReorder={reorderInCategory}
              onTaskDragStart={handleTaskDragStart}
              onTaskDragEnd={clearDraggedTask}
              onCategoryDragOver={handleCategoryDragOver}
              onTaskDrop={handleTaskDrop}
              onCategoryDrop={handleCategoryDrop}
            />
          ) : view === "all" ? (
            <AllCategoriesView
              categories={categories}
              tasks={filteredTasks}
              collapsed={collapsed}
              isDragging={!!draggedTask}
              dropTargetCategoryId={dropTargetCategoryId}
              onToggleCollapsed={toggleCollapsed}
              onAddTask={addTask}
              onToggle={toggleComplete}
              onDelete={deleteTask}
              onEdit={setEditing}
              onReorder={reorderInCategory}
              onTaskDragStart={handleTaskDragStart}
              onTaskDragEnd={clearDraggedTask}
              onCategoryDragOver={handleCategoryDragOver}
              onTaskDrop={handleTaskDrop}
              onCategoryDrop={handleCategoryDrop}
            />
          ) : (
            <FilteredFlatView
              title={headerInfo.title}
              tasks={filteredTasks}
              categories={categories}
              isDragging={!!draggedTask}
              dropTargetCategoryId={dropTargetCategoryId}
              onToggle={toggleComplete}
              onDelete={deleteTask}
              onEdit={setEditing}
              onTaskDragStart={handleTaskDragStart}
              onTaskDragEnd={clearDraggedTask}
              onCategoryDragOver={handleCategoryDragOver}
              onTaskDrop={handleTaskDrop}
              onCategoryDrop={handleCategoryDrop}
            />
          )}

          {filteredTasks.length === 0 &&
            !currentViewIsCategory &&
            view === "all" && <EmptyState />}
        </div>
      </main>

      <TaskEditModal
        task={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSave={updateTask}
        onDelete={deleteTask}
      />

      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; accent: string }> = ({
  label,
  value,
  accent,
}) => (
  <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between">
    <div>
      <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums mt-0.5">{value}</p>
    </div>
    <span
      className={`text-[10px] font-semibold px-2 py-1 rounded-md ${accent}`}
    >
      ●
    </span>
  </div>
);

const AllCategoriesView: React.FC<any> = ({
  categories,
  tasks,
  collapsed,
  isDragging,
  dropTargetCategoryId,
  onToggleCollapsed,
  onAddTask,
  onToggle,
  onDelete,
  onEdit,
  onReorder,
  onTaskDragStart,
  onTaskDragEnd,
  onCategoryDragOver,
  onTaskDrop,
  onCategoryDrop,
}) => (
  <div>
    {categories.map((c: any) => {
      const catTasks = tasks.filter((t: Task) => t.categoryId === c.id);
      return (
        <CategoryGroup
          key={c.id}
          category={c}
          tasks={catTasks}
          collapsed={!!collapsed[c.id]}
          isDragging={isDragging}
          isDropTarget={dropTargetCategoryId === c.id}
          onToggleCollapsed={onToggleCollapsed}
          onAddTask={onAddTask}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onTaskDragStart={onTaskDragStart}
          onTaskDragEnd={onTaskDragEnd}
          onCategoryDragOver={onCategoryDragOver}
          onTaskDrop={onTaskDrop}
          onCategoryDrop={onCategoryDrop}
        />
      );
    })}
  </div>
);

const CategoryView: React.FC<any> = ({
  categoryId,
  categories,
  tasks,
  collapsed,
  isDragging,
  dropTargetCategoryId,
  onToggleCollapsed,
  onAddTask,
  onToggle,
  onDelete,
  onEdit,
  onReorder,
  onTaskDragStart,
  onTaskDragEnd,
  onCategoryDragOver,
  onTaskDrop,
  onCategoryDrop,
}) => {
  const c = categories.find((x: any) => x.id === categoryId);
  if (!c) return <p className="text-slate-500">Category not found.</p>;
  return (
    <CategoryGroup
      category={c}
      tasks={tasks}
      collapsed={!!collapsed[c.id]}
      isDragging={isDragging}
      isDropTarget={dropTargetCategoryId === c.id}
      onToggleCollapsed={onToggleCollapsed}
      onAddTask={onAddTask}
      onToggle={onToggle}
      onDelete={onDelete}
      onEdit={onEdit}
      onTaskDragStart={onTaskDragStart}
      onTaskDragEnd={onTaskDragEnd}
      onCategoryDragOver={onCategoryDragOver}
      onTaskDrop={onTaskDrop}
      onCategoryDrop={onCategoryDrop}
    />
  );
};

const FilteredFlatView: React.FC<{
  title: string;
  tasks: Task[];
  categories: any[];
  isDragging: boolean;
  dropTargetCategoryId: string | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Task) => void;
  onTaskDragStart: (taskId: string, categoryId: string) => void;
  onTaskDragEnd: () => void;
  onCategoryDragOver: (targetCategoryId: string) => void;
  onTaskDrop: (targetCategoryId: string, toId: string) => void;
  onCategoryDrop: (targetCategoryId: string) => void;
}> = ({
  tasks,
  categories,
  isDragging,
  dropTargetCategoryId,
  onToggle,
  onDelete,
  onEdit,
  onTaskDragStart,
  onTaskDragEnd,
  onCategoryDragOver,
  onTaskDrop,
  onCategoryDrop,
}) => {
  // Group by category but show category labels
  const byCategory = new Map<string, Task[]>();
  tasks.forEach((t) => {
    if (!byCategory.has(t.categoryId)) byCategory.set(t.categoryId, []);
    byCategory.get(t.categoryId)!.push(t);
  });

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-sm">No tasks for this filter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories
        .filter((cat) => isDragging || byCategory.has(cat.id))
        .map((cat) => {
          const catTasks = byCategory.get(cat.id) ?? [];
          const sorted = [...catTasks].sort((a, b) => {
            const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
            if (pr !== 0) return pr;
            return a.order - b.order;
          });
          const showDropState = isDragging && dropTargetCategoryId === cat.id;
          return (
            <div
              key={cat.id}
              onDragOver={(e) => {
                e.preventDefault();
                onCategoryDragOver(cat.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                onCategoryDrop(cat.id);
              }}
              className={`rounded-xl transition-all ${
                showDropState
                  ? "bg-indigo-50/70 ring-1 ring-indigo-200 shadow-sm"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {cat.name}
                </h3>
              </div>
              <div className="space-y-2">
                {sorted.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    category={cat}
                    showCategory
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onDragStart={(id) => onTaskDragStart(id, cat.id)}
                    onDragEnd={onTaskDragEnd}
                    onDragOver={(e) => {
                      e.preventDefault();
                      onCategoryDragOver(cat.id);
                    }}
                    onDrop={(e, toId) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onTaskDrop(cat.id, toId);
                    }}
                  />
                ))}
                {sorted.length === 0 && isDragging && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      onCategoryDragOver(cat.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCategoryDrop(cat.id);
                    }}
                    className={`rounded-lg border border-dashed px-3 py-4 text-xs transition ${
                      showDropState
                        ? "border-indigo-300 bg-indigo-100 text-indigo-700"
                        : "border-slate-200 bg-slate-50/70 text-slate-400"
                    }`}
                  >
                    Drop a task here
                  </div>
                )}
                {sorted.length > 0 && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      onCategoryDragOver(cat.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCategoryDrop(cat.id);
                    }}
                    className={`h-3 rounded-md transition ${
                      showDropState ? "bg-indigo-100/80" : ""
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className="text-center py-16">
    <div className="inline-flex w-14 h-14 rounded-full bg-indigo-50 items-center justify-center mb-3">
      <CheckCircle2 className="w-7 h-7 text-indigo-500" />
    </div>
    <h3 className="text-base font-semibold text-slate-800">All clear</h3>
    <p className="text-sm text-slate-500 mt-1">
      No open tasks. Add one to a category to get started.
    </p>
  </div>
);

const ShortcutsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Keyboard className="w-4 h-4" /> Keyboard Shortcuts
      </h2>
      <ul className="space-y-2 text-sm">
        {[
          ["⌘ K", "Focus search"],
          ["Enter", "Add task (in quick add)"],
          ["Esc", "Cancel / close modal"],
          ["?", "Show this dialog"],
          ["⌘ ↵", "Save task in editor"],
        ].map(([k, v]) => (
          <li key={k} className="flex justify-between items-center">
            <span className="text-slate-600">{v}</span>
            <kbd className="text-[11px] border border-slate-200 bg-slate-50 rounded px-1.5 py-0.5 font-mono">
              {k}
            </kbd>
          </li>
        ))}
      </ul>
      <button
        onClick={onClose}
        className="mt-5 w-full py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-md transition"
      >
        Close
      </button>
    </div>
  </div>
);

const SyncIndicator: React.FC<{
  online: boolean;
  syncing: boolean;
  isAuthenticated: boolean;
  lastSyncedAt: number | null;
  onRefresh: () => void;
}> = ({ online, syncing, isAuthenticated, lastSyncedAt, onRefresh }) => {
  if (!isAuthenticated) {
    return (
      <span
        className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium rounded-md bg-slate-100 text-slate-500"
        title="Sign in to sync your tasks across devices"
      >
        <CloudOff className="w-3.5 h-3.5" />
        Local only
      </span>
    );
  }
  if (!online) {
    return (
      <span
        className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200"
        title="Offline — changes will sync when reconnected"
      >
        <CloudOff className="w-3.5 h-3.5" />
        Offline
      </span>
    );
  }
  return (
    <button
      onClick={onRefresh}
      title={
        lastSyncedAt
          ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString()}`
          : "Sync now"
      }
      className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
    >
      {syncing ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Cloud className="w-3.5 h-3.5" />
      )}
      {syncing ? "Syncing" : "Synced"}
    </button>
  );
};

const UserMenu: React.FC<{ email: string; onSignOut: () => void }> = ({
  email,
  onSignOut,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-md bg-white border border-slate-200 hover:bg-slate-50 transition"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white">
          <UserIcon className="w-3.5 h-3.5" />
        </div>
        <span className="text-slate-700 max-w-[140px] truncate">{email}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Signed in
              </p>
              <p className="text-sm font-medium text-slate-800 truncate">
                {email}
              </p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AppLayout;

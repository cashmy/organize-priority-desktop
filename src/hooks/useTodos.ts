import { useCallback, useEffect, useRef, useState } from "react";
import { Category, DEFAULT_CATEGORIES, Task } from "@/lib/todoTypes";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const ANON_TASKS_KEY = "todoapp.tasks.anon";
const ANON_CATS_KEY = "todoapp.categories.anon";
const COLLAPSED_KEY = "todoapp.collapsed.v1";

const userTasksKey = (uid: string) => `todoapp.tasks.user.${uid}`;
const userCatsKey = (uid: string) => `todoapp.categories.user.${uid}`;
const userQueueKey = (uid: string) => `todoapp.queue.user.${uid}`;

const newId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as any).randomUUID();
  }
  // RFC4122-ish fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// ---------- Mapping helpers ----------
type DbCategory = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  position: number;
};
type DbTask = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  notes: string | null;
  priority: "high" | "medium" | "low";
  dow: string[];
  completed: boolean;
  order: number;
};

const dbToCategory = (r: DbCategory): Category => ({
  id: r.id,
  name: r.name,
  color: r.color,
});
const dbToTask = (r: DbTask): Task => ({
  id: r.id,
  title: r.title,
  notes: r.notes ?? undefined,
  categoryId: r.category_id ?? "",
  priority: r.priority,
  dow: (r.dow ?? []) as Task["dow"],
  completed: r.completed,
  createdAt: 0,
  order: r.order,
});

// ---------- Pending operation queue (for offline writes) ----------
type PendingOp =
  | { kind: "task.upsert"; row: DbTask }
  | { kind: "task.delete"; id: string }
  | { kind: "cat.upsert"; row: DbCategory }
  | { kind: "cat.delete"; id: string };

// ---------- Hook ----------
export function useTodos() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const tasksKey = userId ? userTasksKey(userId) : ANON_TASKS_KEY;
  const catsKey = userId ? userCatsKey(userId) : ANON_CATS_KEY;
  const queueKey = userId ? userQueueKey(userId) : null;

  const [categories, setCategories] = useState<Category[]>(() =>
    readJSON<Category[]>(catsKey, DEFAULT_CATEGORIES),
  );
  const [tasks, setTasks] = useState<Task[]>(() =>
    readJSON<Task[]>(tasksKey, []),
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    readJSON<Record<string, boolean>>(COLLAPSED_KEY, {}),
  );
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // Persist locally on change
  useEffect(() => {
    writeJSON(tasksKey, tasks);
  }, [tasks, tasksKey]);
  useEffect(() => {
    writeJSON(catsKey, categories);
  }, [categories, catsKey]);
  useEffect(() => {
    writeJSON(COLLAPSED_KEY, collapsed);
  }, [collapsed]);

  // Online/offline listeners
  useEffect(() => {
    const goOn = () => setOnline(true);
    const goOff = () => setOnline(false);
    window.addEventListener("online", goOn);
    window.addEventListener("offline", goOff);
    return () => {
      window.removeEventListener("online", goOn);
      window.removeEventListener("offline", goOff);
    };
  }, []);

  // Reload local cache when user changes
  const lastUserRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastUserRef.current === userId) return;
    lastUserRef.current = userId;
    setCategories(
      readJSON<Category[]>(catsKey, userId ? [] : DEFAULT_CATEGORIES),
    );
    setTasks(readJSON<Task[]>(tasksKey, []));
  }, [userId, catsKey, tasksKey]);

  // Queue helpers
  const enqueue = useCallback(
    (op: PendingOp) => {
      if (!queueKey) return;
      const queue = readJSON<PendingOp[]>(queueKey, []);
      queue.push(op);
      writeJSON(queueKey, queue);
    },
    [queueKey],
  );

  const drainQueue = useCallback(async () => {
    if (!queueKey) return;
    const queue = readJSON<PendingOp[]>(queueKey, []);
    if (queue.length === 0) return;
    const remaining: PendingOp[] = [];
    for (const op of queue) {
      try {
        if (op.kind === "task.upsert") {
          const { error } = await supabase.from("tasks").upsert(op.row);
          if (error) remaining.push(op);
        } else if (op.kind === "task.delete") {
          const { error } = await supabase
            .from("tasks")
            .delete()
            .eq("id", op.id);
          if (error) remaining.push(op);
        } else if (op.kind === "cat.upsert") {
          const { error } = await supabase.from("categories").upsert(op.row);
          if (error) remaining.push(op);
        } else if (op.kind === "cat.delete") {
          const { error } = await supabase
            .from("categories")
            .delete()
            .eq("id", op.id);
          if (error) remaining.push(op);
        }
      } catch {
        remaining.push(op);
      }
    }
    writeJSON(queueKey, remaining);
  }, [queueKey]);

  // Initial fetch + reconnect sync
  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setSyncing(true);
    try {
      // Drain any queued offline mutations first
      await drainQueue();

      const [
        { data: catRows, error: catErr },
        { data: taskRows, error: taskErr },
      ] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .order("position", { ascending: true }),
        supabase.from("tasks").select("*").order("order", { ascending: true }),
      ]);

      if (catErr || taskErr) {
        return;
      }

      let cats = (catRows ?? []).map(dbToCategory);

      // Seed defaults for new users (zero categories AND zero tasks, no pending ops)
      const queue = queueKey ? readJSON<PendingOp[]>(queueKey, []) : [];
      if (
        cats.length === 0 &&
        (taskRows ?? []).length === 0 &&
        queue.length === 0
      ) {
        // Try to merge from anon localStorage if it exists, else seed defaults
        const anonCats = readJSON<Category[]>(ANON_CATS_KEY, []);

        const anonTasks = readJSON<Task[]>(ANON_TASKS_KEY, []);
        const seedCats = anonCats.length ? anonCats : DEFAULT_CATEGORIES;
        const dbCats = seedCats.map((c, i) => ({
          id: c.id.length === 36 ? c.id : newId(),
          user_id: userId,
          name: c.name,
          color: c.color,
          position: i,
        }));
        const idMap = new Map(seedCats.map((c, i) => [c.id, dbCats[i].id]));
        await supabase.from("categories").insert(dbCats);
        if (anonTasks.length) {
          const dbTasks = anonTasks.map((t) => ({
            id: t.id.length === 36 ? t.id : newId(),
            user_id: userId,
            category_id: idMap.get(t.categoryId) ?? null,
            title: t.title,
            notes: t.notes ?? null,
            priority: t.priority,
            dow: t.dow,
            completed: t.completed,
            order: t.order,
          }));
          await supabase.from("tasks").insert(dbTasks);
        }
        // Clear anon cache after merge
        try {
          localStorage.removeItem(ANON_TASKS_KEY);
          localStorage.removeItem(ANON_CATS_KEY);
        } catch {
          /* ignore */
        }

        // Refetch
        const { data: c2 } = await supabase
          .from("categories")
          .select("*")
          .order("position", { ascending: true });
        const { data: t2 } = await supabase
          .from("tasks")
          .select("*")
          .order("order", { ascending: true });
        setCategories((c2 ?? []).map(dbToCategory));
        setTasks((t2 ?? []).map(dbToTask));
      } else {
        setCategories(cats);
        setTasks((taskRows ?? []).map(dbToTask));
      }
      setLastSyncedAt(Date.now());
    } finally {
      setSyncing(false);
    }
  }, [userId, drainQueue, queueKey]);

  useEffect(() => {
    if (userId && online) {
      fetchAll();
    }
  }, [userId, online, fetchAll]);

  // ---------- Mutations ----------

  const persistTask = useCallback(
    async (t: Task) => {
      if (!userId) return;
      const row: DbTask = {
        id: t.id,
        user_id: userId,
        category_id: t.categoryId || null,
        title: t.title,
        notes: t.notes ?? null,
        priority: t.priority,
        dow: t.dow,
        completed: t.completed,
        order: t.order,
      };
      if (!online) {
        enqueue({ kind: "task.upsert", row });
        return;
      }
      const { error } = await supabase.from("tasks").upsert(row);
      if (error) enqueue({ kind: "task.upsert", row });
    },
    [userId, online, enqueue],
  );

  const persistCategory = useCallback(
    async (c: Category, position: number) => {
      if (!userId) return;
      const row: DbCategory = {
        id: c.id,
        user_id: userId,
        name: c.name,
        color: c.color,
        position,
      };
      if (!online) {
        enqueue({ kind: "cat.upsert", row });
        return;
      }
      const { error } = await supabase.from("categories").upsert(row);
      if (error) enqueue({ kind: "cat.upsert", row });
    },
    [userId, online, enqueue],
  );

  const removeTaskRemote = useCallback(
    async (id: string) => {
      if (!userId) return;
      if (!online) {
        enqueue({ kind: "task.delete", id });
        return;
      }
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) enqueue({ kind: "task.delete", id });
    },
    [userId, online, enqueue],
  );

  const removeCategoryRemote = useCallback(
    async (id: string) => {
      if (!userId) return;
      if (!online) {
        enqueue({ kind: "cat.delete", id });
        return;
      }
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) enqueue({ kind: "cat.delete", id });
    },
    [userId, online, enqueue],
  );

  const addTask = useCallback(
    (
      data: Omit<Task, "id" | "createdAt" | "completed" | "order"> &
        Partial<Pick<Task, "completed">>,
    ) => {
      const id = newId();
      let toPersist: Task | null = null;
      setTasks((prev) => {
        const order = prev.filter(
          (t) => t.categoryId === data.categoryId,
        ).length;
        const t: Task = {
          id,
          createdAt: Date.now(),
          completed: data.completed ?? false,
          order,
          ...data,
        };
        toPersist = t;
        return [...prev, t];
      });
      // Persist after state update
      setTimeout(() => {
        if (toPersist) void persistTask(toPersist);
      }, 0);
    },
    [persistTask],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, ...patch } : t));
        const updated = next.find((t) => t.id === id);
        if (updated) void persistTask(updated);
        return next;
      });
    },
    [persistTask],
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      void removeTaskRemote(id);
    },
    [removeTaskRemote],
  );

  const toggleComplete = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const next = prev.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t,
        );
        const updated = next.find((t) => t.id === id);
        if (updated) void persistTask(updated);
        return next;
      });
    },
    [persistTask],
  );

  const reorderInCategory = useCallback(
    (categoryId: string, fromId: string, toId: string) => {
      setTasks((prev) => {
        const inCat = prev
          .filter((t) => t.categoryId === categoryId)
          .sort((a, b) => a.order - b.order);
        const fromIdx = inCat.findIndex((t) => t.id === fromId);
        const toIdx = inCat.findIndex((t) => t.id === toId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        const reordered = [...inCat];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);
        const orderMap = new Map(reordered.map((t, i) => [t.id, i]));
        const next = prev.map((t) =>
          orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t,
        );
        // Persist all changed tasks in this category
        next.forEach((t) => {
          if (orderMap.has(t.id)) void persistTask(t);
        });
        return next;
      });
    },
    [persistTask],
  );

  const moveTaskToCategory = useCallback(
    (taskId: string, targetCategoryId: string, toId?: string) => {
      setTasks((prev) => {
        const taskToMove = prev.find((t) => t.id === taskId);
        if (!taskToMove) return prev;

        const sourceCategoryId = taskToMove.categoryId;
        if (sourceCategoryId === targetCategoryId) return prev;

        const sourceTasks = prev
          .filter((t) => t.categoryId === sourceCategoryId && t.id !== taskId)
          .sort((a, b) => a.order - b.order);
        const targetTasks = prev
          .filter((t) => t.categoryId === targetCategoryId)
          .sort((a, b) => a.order - b.order);

        const insertAt = toId
          ? targetTasks.findIndex((t) => t.id === toId)
          : targetTasks.length;
        const movedTask: Task = { ...taskToMove, categoryId: targetCategoryId };
        const nextTargetTasks = [...targetTasks];
        nextTargetTasks.splice(
          insertAt === -1 ? nextTargetTasks.length : insertAt,
          0,
          movedTask,
        );

        const updates = new Map<string, Task>();
        sourceTasks.forEach((t, index) => {
          updates.set(t.id, { ...t, order: index });
        });
        nextTargetTasks.forEach((t, index) => {
          updates.set(t.id, {
            ...t,
            categoryId: targetCategoryId,
            order: index,
          });
        });

        const next = prev.map((t) => updates.get(t.id) ?? t);
        next.forEach((t) => {
          if (updates.has(t.id)) void persistTask(t);
        });
        return next;
      });
    },
    [persistTask],
  );

  const addCategory = useCallback(
    (name: string, color: string) => {
      const cat: Category = {
        id: newId(),
        name: name.trim() || "Untitled",
        color,
      };
      let position = 0;
      setCategories((prev) => {
        position = prev.length;
        return [...prev, cat];
      });
      setTimeout(() => void persistCategory(cat, position), 0);
      return cat;
    },
    [persistCategory],
  );

  const updateCategory = useCallback(
    (id: string, patch: Partial<Category>) => {
      setCategories((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
        const updated = next.find((c) => c.id === id);
        const idx = next.findIndex((c) => c.id === id);
        if (updated) void persistCategory(updated, idx);
        return next;
      });
    },
    [persistCategory],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setTasks((prev) => prev.filter((t) => t.categoryId !== id));
      void removeCategoryRemote(id);
    },
    [removeCategoryRemote],
  );

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const refresh = useCallback(() => {
    if (userId && online) void fetchAll();
  }, [userId, online, fetchAll]);

  return {
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
    // sync info
    online,
    syncing,
    lastSyncedAt,
    isAuthenticated: !!userId,
    refresh,
  };
}

import { Category, PRIORITY_RANK, Task } from "@/lib/todoTypes";

export interface ReportCategoryGroup {
  category: Category;
  tasks: Task[];
}

const FALLBACK_CATEGORY: Category = {
  id: "uncategorized",
  name: "Uncategorized",
  color: "#94a3b8",
};

const sortTasksForReport = (tasks: Task[]) => {
  return [...tasks].sort((left, right) => {
    if (left.completed !== right.completed) {
      return left.completed ? 1 : -1;
    }

    const priorityRank =
      PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
    if (priorityRank !== 0) {
      return priorityRank;
    }

    return left.order - right.order;
  });
};

export const groupTasksForReport = (
  tasks: Task[],
  categories: Category[],
): ReportCategoryGroup[] => {
  const categoryMap = new Map(
    categories.map((category) => [category.id, category]),
  );
  const grouped = new Map<string, Task[]>();

  tasks.forEach((task) => {
    const categoryId = task.categoryId || FALLBACK_CATEGORY.id;
    const existing = grouped.get(categoryId) ?? [];
    existing.push(task);
    grouped.set(categoryId, existing);
  });

  const orderedGroups: ReportCategoryGroup[] = [];

  categories.forEach((category) => {
    const categoryTasks = grouped.get(category.id);
    if (!categoryTasks?.length) return;
    orderedGroups.push({
      category,
      tasks: sortTasksForReport(categoryTasks),
    });
    grouped.delete(category.id);
  });

  grouped.forEach((categoryTasks, categoryId) => {
    orderedGroups.push({
      category: categoryMap.get(categoryId) ?? FALLBACK_CATEGORY,
      tasks: sortTasksForReport(categoryTasks),
    });
  });

  return orderedGroups;
};

export const summarizeReportTasks = (tasks: Task[]) => ({
  total: tasks.length,
  open: tasks.filter((task) => !task.completed).length,
  done: tasks.filter((task) => task.completed).length,
});

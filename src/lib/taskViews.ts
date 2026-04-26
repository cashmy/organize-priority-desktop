import { Category, DOW, DOW_LABELS, Task } from "@/lib/todoTypes";

export interface HeaderInfo {
  title: string;
  subtitle: string;
  color?: string;
}

export const getTodayDow = (date: Date = new Date()): DOW => {
  const map: DOW[] = ["Su", "M", "T", "W", "Th", "F", "Sa"];
  return map[date.getDay()];
};

export const filterTasksForView = ({
  tasks,
  view,
  search,
  showCompleted,
  todayDow,
}: {
  tasks: Task[];
  view: string;
  search: string;
  showCompleted: boolean;
  todayDow: DOW;
}) => {
  let output = tasks;

  if (!showCompleted) {
    output = output.filter((task) => !task.completed);
  }

  if (search.trim()) {
    const query = search.toLowerCase();
    output = output.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        (task.notes ?? "").toLowerCase().includes(query),
    );
  }

  if (view === "today") {
    output = output.filter((task) => task.dow.includes(todayDow));
  } else if (view.startsWith("dow:")) {
    const day = view.slice(4) as DOW;
    output = output.filter((task) => task.dow.includes(day));
  } else if (view !== "all") {
    output = output.filter((task) => task.categoryId === view);
  }

  return output;
};

export const getHeaderInfoForView = (
  view: string,
  todayDow: DOW,
  categories: Category[],
): HeaderInfo => {
  if (view === "all") {
    return {
      title: "All Tasks",
      subtitle: "Everything across your categories",
    };
  }

  if (view === "today") {
    return {
      title: `Today · ${DOW_LABELS[todayDow]}`,
      subtitle: "Tasks scheduled for today",
    };
  }

  if (view.startsWith("dow:")) {
    const day = view.slice(4) as DOW;
    return {
      title: DOW_LABELS[day],
      subtitle: `Tasks tagged for ${DOW_LABELS[day]}`,
    };
  }

  const category = categories.find((item) => item.id === view);
  return category
    ? { title: category.name, subtitle: "Category view", color: category.color }
    : { title: "Tasks", subtitle: "" };
};

export const isCategoryView = (view: string) =>
  !["all", "today"].includes(view) && !view.startsWith("dow:");

export const isFilteredView = (view: string) =>
  view === "today" || view.startsWith("dow:");

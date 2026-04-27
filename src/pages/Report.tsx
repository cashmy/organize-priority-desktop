import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { useTodos } from "@/hooks/useTodos";
import { PRIORITY_STYLES } from "@/lib/todoTypes";
import { groupTasksForReport, summarizeReportTasks } from "@/lib/report";
import {
  filterTasksForView,
  getHeaderInfoForView,
  getTodayDow,
} from "@/lib/taskViews";

const Report: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categories, tasks } = useTodos();

  const view = searchParams.get("view") ?? "all";
  const search = searchParams.get("search") ?? "";
  const showCompleted = searchParams.get("done") === "1";
  const todayDow = useMemo(() => getTodayDow(), []);

  const filteredTasks = useMemo(
    () =>
      filterTasksForView({
        tasks,
        view,
        search,
        showCompleted,
        todayDow,
      }),
    [tasks, view, search, showCompleted, todayDow],
  );

  const headerInfo = useMemo(
    () => getHeaderInfoForView(view, todayDow, categories),
    [view, todayDow, categories],
  );

  const reportGroups = useMemo(
    () => groupTasksForReport(filteredTasks, categories),
    [filteredTasks, categories],
  );

  const summary = useMemo(
    () => summarizeReportTasks(filteredTasks),
    [filteredTasks],
  );

  const generatedAt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date()),
    [],
  );

  const returnToAppPath = useMemo(() => {
    const params = new URLSearchParams({
      view,
      search,
      done: showCompleted ? "1" : "0",
    });

    return `/?${params.toString()}`;
  }, [view, search, showCompleted]);

  const handleBackToApp = () => {
    window.close();

    window.setTimeout(() => {
      navigate(returnToAppPath, { replace: true });
    }, 150);
  };

  return (
    <div className="report-page min-h-screen bg-slate-100 text-slate-900">
      <div className="report-shell mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="report-actions mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={handleBackToApp}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back To App
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </button>
        </div>

        <section className="report-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <FileText className="h-3.5 w-3.5" />
                Task Report
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {headerInfo.title}
              </h1>
              {headerInfo.subtitle && (
                <p className="mt-1 text-sm text-slate-500">
                  {headerInfo.subtitle}
                </p>
              )}
            </div>
          </div>

          <dl className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-3">
            <ReportSummaryRow label="Generated" value={generatedAt} />
            <ReportSummaryRow
              label="Show Done"
              value={showCompleted ? "Included" : "Hidden"}
            />
            <ReportSummaryRow
              label="Search"
              value={search.trim() ? search : "None"}
            />
            <ReportSummaryRow
              label="Categories"
              value={String(reportGroups.length)}
              numeric
            />
            <ReportSummaryRow
              label="Visible Tasks"
              value={String(summary.total)}
              numeric
            />
            <ReportSummaryRow
              label="Open Tasks"
              value={String(summary.open)}
              numeric
            />
            <ReportSummaryRow
              label="Completed Tasks"
              value={String(summary.done)}
              numeric
            />
          </dl>
        </section>

        {reportGroups.length === 0 ? (
          <section className="report-card mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              No tasks in this report
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              The current view does not have any tasks that match the active
              filters.
            </p>
          </section>
        ) : (
          <div className="report-columns mt-6">
            {reportGroups.map(({ category, tasks: categoryTasks }) => (
              <section
                key={category.id}
                className="report-category report-card mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <h2 className="text-base font-semibold text-slate-900">
                    {category.name}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {categoryTasks.length}
                  </span>
                </div>

                <ul className="space-y-3">
                  {categoryTasks.map((task) => {
                    const priorityStyle = PRIORITY_STYLES[task.priority];
                    return (
                      <li
                        key={task.id}
                        className={`rounded-xl border px-4 py-3 ${
                          task.completed
                            ? "border-slate-200 bg-slate-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1.5 h-2 w-2 rounded-full ${priorityStyle.dot}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-sm ${
                                  task.completed
                                    ? "text-slate-400 line-through"
                                    : "font-medium text-slate-800"
                                }`}
                              >
                                {task.title}
                              </span>
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${priorityStyle.badge}`}
                              >
                                {priorityStyle.label}
                              </span>
                              {task.dow.map((day) => (
                                <span
                                  key={`${task.id}-${day}`}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                                >
                                  {day}
                                </span>
                              ))}
                            </div>

                            {task.notes && (
                              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ReportSummaryRow: React.FC<{
  label: string;
  value: string;
  numeric?: boolean;
}> = ({ label, value, numeric = false }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 text-sm">
    <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {label}
    </dt>
    <dd
      className={`min-w-0 flex-1 text-right font-medium text-slate-700 ${
        numeric ? "tabular-nums" : "break-words"
      }`}
    >
      {value}
    </dd>
  </div>
);

export default Report;

# Task Report View Feature Note

This document describes the task report preview and print flow.

## Summary

The application exposes a report view from the top bar. The report opens as a dedicated preview page and is intended to be printed through the browser print dialog or saved as a PDF using the browser's print-to-PDF option.

## How It Is Requested

- A `Report` action appears in the top-right action cluster of the main app layout.
- The action opens the report in a dedicated preview tab using the current task-view context.
- Repeated report requests reuse the same preview tab instead of creating a new tab each time.
- `Back To App` closes the preview tab when possible; if the report was opened directly, it returns to the app with the same report context.

## What The Report Uses

The report reflects the user's current task context:

- current view selection
- current search filter
- current `Show done` toggle state

That means the same route can produce:

- an All Tasks report
- a Today report
- a category-specific report
- a day-of-week filtered report

## Report Layout

- screen-friendly preview first
- grouped by category
- task rows include priority badge and day-of-week badges
- two-column layout on larger screens and in print
- generated timestamp and summary counts at the top

## Print And PDF Export

The current implementation relies on the browser print dialog.

From the report page, the user can:

- print to a physical printer
- choose `Save as PDF` where supported by the browser and operating system

No dedicated PDF generation library is used in this version.

## Current Limitations

- The report is optimized for on-screen preview first, not print-first typography.
- Category sections may split across columns or pages.
- The PDF output quality depends on the browser's print engine.

## Source Anchors

- `src/components/AppLayout.tsx`
- `src/pages/Report.tsx`
- `src/lib/taskViews.ts`
- `src/lib/report.ts`
- `src/index.css`
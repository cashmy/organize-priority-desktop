# Task Drag and Drop Feature Note

This document describes the task drag-and-drop behavior implemented in the application UI.

It is intentionally feature-focused. Persistence internals and backend architecture are documented separately.

## Summary

Tasks can be dragged:

- within the same category to reorder them
- from one category to another category
- into empty categories
- across the filtered task views where tasks are grouped by category

When a task is dropped into a new category, the application updates the task's `categoryId`, recalculates task ordering, and persists the change through the existing task persistence flow.

## Supported Views

Drag-and-drop is supported in:

- the full grouped "All Tasks" view
- an individual category view
- filtered grouped views such as "Today" and day-of-week filters

In filtered views, categories with no currently visible matching tasks appear as drop targets while a drag is active so cross-category moves are still possible.

## Interaction Model

### Reorder within a category

Drag a task onto another task in the same category to reorder it relative to that task.

### Move to another category

Drag a task onto:

- another task in a different category to insert it there
- the category drop area to move it into that category
- an empty category placeholder to move it into that category

### Drop state feedback

While dragging:

- the current destination category is visually highlighted
- empty destination categories show a visible drop target
- categories in filtered views can surface as valid drop targets even when they do not currently contain visible filtered tasks

## Persistence Behavior

On cross-category drop, the application:

1. updates the dragged task's `categoryId`
2. recalculates `order` values for the source category
3. recalculates `order` values for the destination category
4. persists the affected task rows through the existing task save path

For authenticated users, those updates are written to the hosted backend through the existing Supabase-compatible data layer.

For local or anonymous usage, task state continues to persist through the app's existing browser-side state persistence behavior.

## Current Limitations

- Drag-and-drop is pointer-based and does not provide a keyboard reordering interaction.
- Same-category "drop to end" behavior depends on the available drop area rather than a dedicated explicit control.
- This note describes UI behavior only and does not verify live backend policies.

## Source Anchors

- `src/components/AppLayout.tsx`
- `src/components/todo/CategoryGroup.tsx`
- `src/components/todo/TaskCard.tsx`
- `src/hooks/useTodos.ts`
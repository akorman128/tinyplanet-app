# Edit & delete your own comments

Worktree: `worktree-edit-delete-comments` (off `origin/main` @ 3fc9fd1).

UI-only feature. The data layer already exists on `main`: `useUpdateComment` (sets
`edited_at`, scoped `.eq("author_id", profile.id)`), `useDeleteComment` (same scope), RLS
UPDATE/DELETE policies, and `CommentItem`'s `(edited)` label.

Decisions: **inline edit**; **cascade delete** (matches DB `ON DELETE CASCADE`).

## Plan

- [x] 1. **`design-system/CommentItem.tsx`** (presentational/provider-free; not in design-sync map)
  - [x] Props: `currentUserId`, `onEdit(commentId, body)`, `onDelete(comment)`; threaded into nested reply `CommentItem`s.
  - [x] Author-only three-dot menu (`Icons.dots` → `Alert` action sheet: Edit / Delete / Cancel), mirroring `PostCard.handleOptions`.
  - [x] Inline edit: `Input` (multiline) + Cancel/Save; validates non-empty (`<=500`); saving state; edits body only (attached list untouched). No-op save when unchanged.
  - [x] Delete confirmation `Alert`; warns replies are removed too when `comment.replies?.length`.
- [x] 2. **`app/(protected)/comments.tsx`** (owns mutations + local state)
  - [x] `useRequireProfile`, `useUpdateComment`, `useDeleteComment`.
  - [x] `handleEditComment`: optimistic recursive body+`edited_at` patch; revert + Alert + rethrow on error (editor stays open to retry).
  - [x] `handleDeleteComment`: optimistic recursive prune; decrement `currentCount` + `commentCountStore` by the deleted **subtree** size (cascade); revert on error.
  - [x] Passes `currentUserId`/`onEdit`/`onDelete` into `<CommentItem>`.
- [x] 3. **Verify** — `tsc --noEmit` clean; eslint clean on changed files; 79/79 hook tests pass.

## Review

### What changed (4 files)
- **`design-system/CommentItem.tsx`** — author-gated three-dot menu + inline editor + delete confirmation.
  Stays presentational: all data flows through new `currentUserId`/`onEdit`/`onDelete` props (threaded
  into nested replies). Not part of the design-sync `componentSrcMap`, so no sync impact.
- **`app/(protected)/comments.tsx`** — wires `useUpdateComment`/`useDeleteComment` + `useRequireProfile`;
  `handleEditComment` / `handleDeleteComment` patch local state optimistically and revert on failure.
- **`__tests__/hooks/useComments.test.tsx`** (new) — 6 tests: update stamps `edited_at` + `author_id`
  scoping + `list_id` only when provided + error path; delete `id`/`author_id` scoping + error path.
  (These mutations shipped on `main` with zero coverage.)
- **`tasks/todo.md`** — this plan.

### Notes / decisions
- **No data-layer changes**: `useUpdateComment`/`useDeleteComment`, RLS UPDATE/DELETE, `edited_at`, and the
  `(edited)` label already existed on `main`. This was a UI-wiring + test-coverage task.
- **Cascade count**: comment_count counts every comment incl. replies, and the data tree can nest beyond one
  visual level, so the optimistic decrement counts the whole deleted subtree (`countSubtree`). The mutation's
  `posts.all` invalidation reconciles the authoritative count; `commentCountStore` holds an absolute value so
  setting it is idempotent (no double-decrement with the invalidation).
- **Not done autonomously**: a live simulator run. Logic is covered by typecheck + the 79-test hook suite and
  reuses already-proven components (`Input`, `Alert`).

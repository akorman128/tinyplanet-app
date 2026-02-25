# Replace CommentsSheet with full-page Comments screen

## Context
`@gorhom/bottom-sheet` v5 crashes with `unstable_getBoundingClientRect` during container measurement on mount — both `BottomSheet` and `BottomSheetModal` variants. This is a library-level bug with Reanimated v4 + Fabric. Rather than fight it, replace with a full-page screen matching the app's existing navigation patterns.

## Changes

### 1. Create `stores/commentCountStore.ts`
Small Zustand store to propagate comment count updates back to the feed when user returns from comments screen.

```ts
{
  updates: Record<postId, newCount>,
  set(postId, count): void,
  consume(postId): number | undefined  // returns and removes
}
```

### 2. Create `app/(protected)/comments.tsx` (new screen)
Full-page comments screen. Follows the `create-post.tsx` pattern:
- `SafeAreaView` + `ScreenHeader` (title "Comments", X to close)
- `FlatList` for comments (reuse `CommentItem` from design-system)
- Fixed bottom input bar with `KeyboardAvoidingView` (follow `ChatInput.tsx` pattern)
- Use `CommentInput` from design-system for the input

**Route params:** `postId`, `commentCount` (via `useLocalSearchParams`)

**All logic moves here from CommentsSheet:**
- `useComments().getComments` on mount
- Comment creation with optimistic UI + revert on error
- Reply-to state (purple chip above input)
- List attachment via `useListSelectionStore` + navigate to `/select-list`
- Like/unlike with optimistic updates (recursive through replies)
- Update `commentCountStore` after successful create

**Keyboard handling:** Wrap the bottom input section in `KeyboardAvoidingView` with `behavior="padding"` on iOS, matching `ChatInput.tsx` (line 75).

### 3. Register route in `app/(protected)/_layout.tsx`
Add `<Stack.Screen name="comments" options={{ headerShown: false }} />`.

### 4. Update `components/FeedView.tsx`
- Remove `commentsSheetRef`, `activePost` state, `BottomSheetModal` import
- Remove `CommentsSheet` render and all related handlers (`handleCommentsSheetChange`, `handleOpenCommentListPicker`, `handleRemoveCommentList`)
- Remove `listSelectionStore` import
- `handleOpenComments` → navigate: `router.push({ pathname: "/comments", params: { postId, commentCount } })`
- Remove `onCommentsSheetChange` prop (no longer needed)
- Subscribe to `commentCountStore` — on each render, consume any pending updates and apply to posts state

### 5. Update `app/(protected)/(tabs)/feed.tsx`
- Remove `BottomSheetModalProvider` and `@gorhom/bottom-sheet` import
- Remove `onCommentsSheetChange` prop from `<FeedView />`

### 6. Delete `components/CommentsSheet.tsx`
All functionality moved to `app/(protected)/comments.tsx`.

## Files touched
- `stores/commentCountStore.ts` — **new**
- `app/(protected)/comments.tsx` — **new**
- `app/(protected)/_layout.tsx` — add route
- `components/FeedView.tsx` — simplify (remove sheet logic, add navigation)
- `app/(protected)/(tabs)/feed.tsx` — remove BottomSheetModalProvider
- `components/CommentsSheet.tsx` — **delete**

## Verification
- Open feed, tap comment icon → navigates to comments screen (not a sheet)
- Comments load, can scroll
- Submit a comment → appears optimistically, count updates
- Reply to a comment → reply context chip shows, reply nests correctly
- Attach a list → navigate to select-list, return, chip shows
- Like/unlike → toggles with correct count
- Close comments → feed shows updated comment count
- Keyboard opens → input stays visible above keyboard

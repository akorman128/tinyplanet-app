-- Add category column to lists table for POI type filtering
-- Valid categories: restaurant, bar, cafe, shopping, nightlife, other

-- Step 1: Add category column with default value
ALTER TABLE public.lists
ADD COLUMN category text NOT NULL DEFAULT 'other'
CHECK (category IN ('restaurant', 'bar', 'cafe', 'shopping', 'nightlife', 'other'));

-- Step 2: Add index for filtering by category
CREATE INDEX idx_lists_category ON public.lists(category);

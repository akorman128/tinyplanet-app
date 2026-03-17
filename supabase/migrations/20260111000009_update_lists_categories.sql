-- Update category values for lists table
-- Old: restaurant, bar, cafe, shopping, nightlife, other
-- New: nightlife, eat_drink, activities, explore, shop, work

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE public.lists DROP CONSTRAINT IF EXISTS lists_category_check;

-- Step 2: Migrate existing data to new category values
UPDATE public.lists SET category = 'eat_drink' WHERE category IN ('restaurant', 'bar', 'cafe');
UPDATE public.lists SET category = 'shop' WHERE category = 'shopping';
UPDATE public.lists SET category = 'explore' WHERE category = 'other';
-- 'nightlife' stays as 'nightlife'

-- Step 3: Update default value
ALTER TABLE public.lists ALTER COLUMN category SET DEFAULT 'eat_drink';

-- Step 4: Add new CHECK constraint with updated values
ALTER TABLE public.lists
ADD CONSTRAINT lists_category_check
CHECK (category IN ('nightlife', 'eat_drink', 'activities', 'explore', 'shop', 'work'));

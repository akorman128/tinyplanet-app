-- Add indexes to friendships table to improve query performance
-- This fixes timeout issues in get_mutual_locations and get_friend_locations RPCs

-- Critical: Index on status column for WHERE filtering
-- This eliminates full table scans in friend_edges_v
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Composite indexes for user_a and user_b with status
-- These optimize the bidirectional friendship queries
CREATE INDEX IF NOT EXISTS idx_friendships_user_a_status ON friendships(user_a, status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_b_status ON friendships(user_b, status);

-- Add comment for documentation
COMMENT ON INDEX idx_friendships_status IS 'Improves performance of friend_edges_v queries by eliminating full table scans';
COMMENT ON INDEX idx_friendships_user_a_status IS 'Optimizes friendship lookups for user_a with status filtering';
COMMENT ON INDEX idx_friendships_user_b_status IS 'Optimizes friendship lookups for user_b with status filtering';

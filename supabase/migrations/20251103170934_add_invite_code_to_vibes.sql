-- Add invite_code_id column to vibes table
-- This allows tracking which invite code (if any) led to a vibe being created

ALTER TABLE "public"."vibes"
ADD COLUMN "invite_code_id" "uuid" REFERENCES "public"."invite_codes"("id") ON DELETE SET NULL;

-- Create an index for better query performance when filtering by invite_code_id
CREATE INDEX "idx_vibes_invite_code_id" ON "public"."vibes"("invite_code_id");

-- Add a comment to document the column's purpose
COMMENT ON COLUMN "public"."vibes"."invite_code_id" IS 'Optional reference to the invite code that facilitated this vibe connection';

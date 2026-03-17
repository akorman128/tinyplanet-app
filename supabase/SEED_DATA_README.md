# Database Seed Data Guide

This guide explains how to use the test data seeding migrations for the Tiny Planet database.

## Overview

The seed data migrations add 19 test users to your database (for a total of 20 including Alex Korman), complete with:

- **19 profiles** with realistic data (names, locations, phone numbers, etc.)
- **19 invite codes** (all redeemed, forming an invitation chain)
- **55 friendships** (all accepted, moderately connected network averaging 4-6 friends per user)
- **23 vibes** (19 linked to invite codes + 4 organic vibes between friends)

## Migration Files

```
supabase/migrations/
├── 20251112052545_seed_test_data.sql         # Inserts all seed data
└── 20251112052546_rollback_seed_test_data.sql # Removes all seed data
```

## Important: Foreign Key Constraint Handling

The seed migration temporarily removes the `profiles_id_fkey` constraint (which links `profiles.id` to `auth.users.id`) to allow creating test profiles without corresponding auth users. This is safe for test/development data and the constraint is automatically restored at the end of the migration using the `NOT VALID` flag, which means:

- New inserts will still be validated against the constraint
- Existing seed data (without auth users) is allowed to remain
- This is a common pattern for seed/test data in development

## How to Use

### Option 1: Apply Migrations via Supabase CLI (Recommended)

If you haven't already, link your local project to your Supabase project:

```bash
npx supabase link --project-ref your-project-ref
```

Apply the seed migration:

```bash
npx supabase db push
```

This will apply all pending migrations including the seed data.

### Option 2: Apply Manually via Supabase Studio

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `20251112052545_seed_test_data.sql`
4. Click **Run**

### Option 3: Apply via psql

If you have direct database access:

```bash
psql "your-database-connection-string" -f supabase/migrations/20251112052545_seed_test_data.sql
```

## Rolling Back (Removing Seed Data)

If you need to remove the seed data (e.g., you made a mistake or want to re-seed):

### Via Supabase Studio

1. Go to **SQL Editor** in Supabase Studio
2. Copy and paste the contents of `20251112052546_rollback_seed_test_data.sql`
3. Click **Run**

### Via psql

```bash
psql "your-database-connection-string" -f supabase/migrations/20251112052546_rollback_seed_test_data.sql
```

**Note:** The rollback script only removes seed data by specific UUIDs. It will **NOT** affect Alex Korman or any other real data.

## Seed Data Structure

### User Invitation Chain

The seed creates a linear invitation chain starting from Alex Korman:

```
Alex Korman (existing)
  └─> Sarah Chen
       └─> Marcus Johnson
            └─> Emily Rodriguez
                 └─> David Kim
                      └─> Jessica Martinez
                           └─> Ryan O'Connor
                                └─> Aisha Patel
                                     └─> Chris Anderson
                                          └─> Nina Kowalski
                                               └─> Tyler Brooks
                                                    └─> Priya Sharma
                                                         └─> Jordan Lee
                                                              └─> Samantha Wu
                                                                   └─> Alex Thompson
                                                                        └─> Maya Jackson
                                                                             └─> Ethan Davis
                                                                                  └─> Olivia Brown
                                                                                       └─> Liam Garcia
                                                                                            └─> Zoe Miller
```

### Friendship Network

Each user has 3-7 accepted friendships:
- Always friends with their inviter
- Additional friendships with nearby users in the chain
- Some cross-chain friendships for variety

Example: Sarah Chen is friends with:
1. Alex Korman (her inviter)
2. Marcus Johnson (she invited)
3. Emily Rodriguez
4. David Kim
5. Aisha Patel

### Phone Numbers

All seed users have phone numbers in the range: `+13472810001` to `+13472810019`

### Locations

Users are spread across major US cities with realistic PostGIS coordinates:
- San Francisco, Chicago, Los Angeles, Seattle, Austin, Boston, Denver, Portland, Miami, Nashville, San Diego, Philadelphia, Atlanta, Phoenix, Detroit, Minneapolis, Tampa, Las Vegas

### Invite Codes

Each user has a unique 8-character invite code (e.g., `ALEX0001`, `SARA0002`, etc.)
All codes are in `redeemed` status with proper timestamps.

### Vibes

- 19 vibes linked to invite codes (inviter → invitee at signup time)
- 4 additional organic vibes between friends
- Each vibe contains 3 unique emojis themed to the relationship

## Verification Queries

After seeding, you can verify the data:

### Count seed profiles

```sql
SELECT COUNT(*) as seed_user_count
FROM public.profiles
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  '99999999-9999-9999-9999-999999999999',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '10101010-1010-1010-1010-101010101010',
  '20202020-2020-2020-2020-202020202020',
  '30303030-3030-3030-3030-303030303030',
  '40404040-4040-4040-4040-404040404040'
);
-- Expected: 19
```

### View all users with their friend counts

```sql
SELECT
  p.full_name,
  p.phone_number,
  p.hometown,
  COUNT(DISTINCT f.id) as friend_count
FROM public.profiles p
LEFT JOIN public.friendships f ON (p.id = f.user_a OR p.id = f.user_b)
WHERE f.status = 'accepted'
GROUP BY p.id, p.full_name, p.phone_number, p.hometown
ORDER BY p.created_at;
```

### View invitation chain

```sql
SELECT
  p.full_name as user_name,
  inviter.full_name as invited_by,
  ic.code as invite_code_used,
  ic.redeemed_at
FROM public.profiles p
LEFT JOIN public.profiles inviter ON p.invited_by = inviter.id
LEFT JOIN public.invite_codes ic ON ic.inviter_id = inviter.id
  AND ic.redeemed_by_phone = p.phone_number
ORDER BY p.created_at;
```

### Count all relationships

```sql
SELECT
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.friendships WHERE status = 'accepted') as total_friendships,
  (SELECT COUNT(*) FROM public.invite_codes WHERE status = 'redeemed') as total_redeemed_invites,
  (SELECT COUNT(*) FROM public.vibes) as total_vibes;
-- Expected: 20 profiles, 55+ friendships, 19+ invites, 23+ vibes
```

## Important Notes

1. **Alex Korman is preserved**: The seed script does not modify or delete the existing Alex Korman profile (`b6b50501-a70f-4954-a2de-c800bfc867e4`)

2. **Fixed UUIDs**: All seed data uses predictable UUIDs for easy rollback and testing

3. **Timestamps**: Users are created with staggered timestamps (30 days ago to 6 hours ago) to simulate realistic signup patterns

4. **Foreign key constraint**: The migration temporarily drops the `profiles_id_fkey` constraint and restores it with `NOT VALID` at the end. This allows test profiles to exist without auth.users entries while still enforcing the constraint on future inserts.

5. **Cascading deletes**: The rollback script deletes in the correct order (vibes → friendships → invite_codes → profiles) to respect foreign key constraints

6. **Safe rollback**: The rollback migration only targets specific seed UUIDs, so it's safe to run even if you have other real data in the database

## Troubleshooting

### Migration fails with "duplicate key" error

This likely means the seed data already exists. Run the rollback migration first, then re-apply the seed migration.

### Users appear but have no friendships

Check that all INSERT statements in the seed file completed successfully. You may need to rollback and re-apply.

### Want to customize the seed data

Edit `20251112052545_seed_test_data.sql` before applying. Make sure to also update the rollback migration if you change any UUIDs.

### How to re-seed with different data

1. Run the rollback migration
2. Modify the seed migration file as needed
3. Apply the seed migration again
4. Update the rollback migration if you changed any IDs

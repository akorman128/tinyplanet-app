-- Seed Test Data Migration
-- Adds 19 test users with complete signup flow data
-- Total users: 20 (including existing Alex Korman)
-- All users have: profiles, invite codes, friendships, and vibes

-- NOTE: This can be rolled back using the corresponding rollback migration

-- ============================================================================
-- DROP FOREIGN KEY CONSTRAINT (Temporarily)
-- ============================================================================
-- The profiles table has a foreign key to auth.users, but we're creating
-- test profiles without auth users. We'll restore this constraint at the end.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- ============================================================================
-- PROFILES (20 users including Alex Korman)
-- ============================================================================

-- Alex Korman must exist first since other profiles reference him via invited_by
INSERT INTO public.profiles (id, full_name, phone_number, birthday, hometown, location, onboarding_invites_sent, updated_at, created_at)
VALUES
  ('b6b50501-a70f-4954-a2de-c800bfc867e4', 'Alex Korman', '+13472810000', '1997-01-01', 'New York', 'SRID=4326;POINT(-73.9857 40.7484)', true, NOW(), NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, phone_number, birthday, hometown, location, invited_by, onboarding_invites_sent, updated_at, created_at)
VALUES
  -- User 1: Invited by Alex
  ('11111111-1111-1111-1111-111111111111', 'Sarah Chen', '+13472810001', '1998-03-15', 'San Francisco', 'SRID=4326;POINT(-122.4194 37.7749)', 'b6b50501-a70f-4954-a2de-c800bfc867e4', true, NOW(), NOW() - INTERVAL '30 days'),

  -- User 2: Invited by Sarah
  ('22222222-2222-2222-2222-222222222222', 'Marcus Johnson', '+13472810002', '1995-07-22', 'Chicago', 'SRID=4326;POINT(-87.6298 41.8781)', '11111111-1111-1111-1111-111111111111', true, NOW(), NOW() - INTERVAL '28 days'),

  -- User 3: Invited by Marcus
  ('33333333-3333-3333-3333-333333333333', 'Emily Rodriguez', '+13472810003', '2000-11-08', 'Los Angeles', 'SRID=4326;POINT(-118.2437 34.0522)', '22222222-2222-2222-2222-222222222222', true, NOW(), NOW() - INTERVAL '26 days'),

  -- User 4: Invited by Emily
  ('44444444-4444-4444-4444-444444444444', 'David Kim', '+13472810004', '1997-01-30', 'Seattle', 'SRID=4326;POINT(-122.3321 47.6062)', '33333333-3333-3333-3333-333333333333', true, NOW(), NOW() - INTERVAL '24 days'),

  -- User 5: Invited by David
  ('55555555-5555-5555-5555-555555555555', 'Jessica Martinez', '+13472810005', '1999-05-12', 'Austin', 'SRID=4326;POINT(-97.7431 30.2672)', '44444444-4444-4444-4444-444444444444', true, NOW(), NOW() - INTERVAL '22 days'),

  -- User 6: Invited by Jessica
  ('66666666-6666-6666-6666-666666666666', 'Ryan O''Connor', '+13472810006', '1996-09-25', 'Boston', 'SRID=4326;POINT(-71.0589 42.3601)', '55555555-5555-5555-5555-555555555555', true, NOW(), NOW() - INTERVAL '20 days'),

  -- User 7: Invited by Ryan
  ('77777777-7777-7777-7777-777777777777', 'Aisha Patel', '+13472810007', '2001-02-14', 'Denver', 'SRID=4326;POINT(-104.9903 39.7392)', '66666666-6666-6666-6666-666666666666', true, NOW(), NOW() - INTERVAL '18 days'),

  -- User 8: Invited by Aisha
  ('88888888-8888-8888-8888-888888888888', 'Chris Anderson', '+13472810008', '1994-12-03', 'Portland', 'SRID=4326;POINT(-122.6765 45.5152)', '77777777-7777-7777-7777-777777777777', true, NOW(), NOW() - INTERVAL '16 days'),

  -- User 9: Invited by Chris
  ('99999999-9999-9999-9999-999999999999', 'Nina Kowalski', '+13472810009', '1998-08-19', 'Miami', 'SRID=4326;POINT(-80.1918 25.7617)', '88888888-8888-8888-8888-888888888888', true, NOW(), NOW() - INTERVAL '14 days'),

  -- User 10: Invited by Nina
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tyler Brooks', '+13472810010', '1996-04-07', 'Nashville', 'SRID=4326;POINT(-86.7816 36.1627)', '99999999-9999-9999-9999-999999999999', true, NOW(), NOW() - INTERVAL '12 days'),

  -- User 11: Invited by Tyler
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Priya Sharma', '+13472810011', '2000-06-28', 'San Diego', 'SRID=4326;POINT(-117.1611 32.7157)', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, NOW(), NOW() - INTERVAL '10 days'),

  -- User 12: Invited by Priya
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Jordan Lee', '+13472810012', '1995-10-16', 'Philadelphia', 'SRID=4326;POINT(-75.1652 39.9526)', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true, NOW(), NOW() - INTERVAL '8 days'),

  -- User 13: Invited by Jordan
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Samantha Wu', '+13472810013', '1999-01-11', 'Atlanta', 'SRID=4326;POINT(-84.3880 33.7490)', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true, NOW(), NOW() - INTERVAL '6 days'),

  -- User 14: Invited by Samantha
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Alex Thompson', '+13472810014', '1997-11-23', 'Phoenix', 'SRID=4326;POINT(-112.0740 33.4484)', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true, NOW(), NOW() - INTERVAL '4 days'),

  -- User 15: Invited by Alex T
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Maya Jackson', '+13472810015', '2001-03-09', 'Detroit', 'SRID=4326;POINT(-83.0458 42.3314)', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', true, NOW(), NOW() - INTERVAL '3 days'),

  -- User 16: Invited by Maya
  ('10101010-1010-1010-1010-101010101010', 'Ethan Davis', '+13472810016', '1998-07-05', 'Minneapolis', 'SRID=4326;POINT(-93.2650 44.9778)', 'ffffffff-ffff-ffff-ffff-ffffffffffff', true, NOW(), NOW() - INTERVAL '2 days'),

  -- User 17: Invited by Ethan
  ('20202020-2020-2020-2020-202020202020', 'Olivia Brown', '+13472810017', '1996-12-18', 'Tampa', 'SRID=4326;POINT(-82.4572 27.9506)', '10101010-1010-1010-1010-101010101010', true, NOW(), NOW() - INTERVAL '1 day'),

  -- User 18: Invited by Olivia
  ('30303030-3030-3030-3030-303030303030', 'Liam Garcia', '+13472810018', '1999-09-02', 'Las Vegas', 'SRID=4326;POINT(-115.1398 36.1699)', '20202020-2020-2020-2020-202020202020', true, NOW(), NOW() - INTERVAL '12 hours'),

  -- User 19: Invited by Liam
  ('40404040-4040-4040-4040-404040404040', 'Zoe Miller', '+13472810019', '2000-04-21', 'Portland', 'SRID=4326;POINT(-122.6587 45.5122)', '30303030-3030-3030-3030-303030303030', true, NOW(), NOW() - INTERVAL '6 hours');

-- ============================================================================
-- INVITE CODES (19 codes - one per new user)
-- ============================================================================

INSERT INTO public.invite_codes (id, code, inviter_id, status, redeemed_by_phone, redeemed_at, created_at, expires_at)
VALUES
  -- Alex's invite code (redeemed by Sarah)
  ('a0000001-0000-0000-0000-000000000001', 'ALEX0001', 'b6b50501-a70f-4954-a2de-c800bfc867e4', 'redeemed', '+13472810001', NOW() - INTERVAL '30 days', NOW() - INTERVAL '31 days', NOW() + INTERVAL '30 days'),

  -- Sarah's invite code (redeemed by Marcus)
  ('a0000002-0000-0000-0000-000000000002', 'SARA0002', '11111111-1111-1111-1111-111111111111', 'redeemed', '+13472810002', NOW() - INTERVAL '28 days', NOW() - INTERVAL '29 days', NOW() + INTERVAL '30 days'),

  -- Marcus's invite code (redeemed by Emily)
  ('a0000003-0000-0000-0000-000000000003', 'MARC0003', '22222222-2222-2222-2222-222222222222', 'redeemed', '+13472810003', NOW() - INTERVAL '26 days', NOW() - INTERVAL '27 days', NOW() + INTERVAL '30 days'),

  -- Emily's invite code (redeemed by David)
  ('a0000004-0000-0000-0000-000000000004', 'EMIL0004', '33333333-3333-3333-3333-333333333333', 'redeemed', '+13472810004', NOW() - INTERVAL '24 days', NOW() - INTERVAL '25 days', NOW() + INTERVAL '30 days'),

  -- David's invite code (redeemed by Jessica)
  ('a0000005-0000-0000-0000-000000000005', 'DAVI0005', '44444444-4444-4444-4444-444444444444', 'redeemed', '+13472810005', NOW() - INTERVAL '22 days', NOW() - INTERVAL '23 days', NOW() + INTERVAL '30 days'),

  -- Jessica's invite code (redeemed by Ryan)
  ('a0000006-0000-0000-0000-000000000006', 'JESS0006', '55555555-5555-5555-5555-555555555555', 'redeemed', '+13472810006', NOW() - INTERVAL '20 days', NOW() - INTERVAL '21 days', NOW() + INTERVAL '30 days'),

  -- Ryan's invite code (redeemed by Aisha)
  ('a0000007-0000-0000-0000-000000000007', 'RYAN0007', '66666666-6666-6666-6666-666666666666', 'redeemed', '+13472810007', NOW() - INTERVAL '18 days', NOW() - INTERVAL '19 days', NOW() + INTERVAL '30 days'),

  -- Aisha's invite code (redeemed by Chris)
  ('a0000008-0000-0000-0000-000000000008', 'AISH0008', '77777777-7777-7777-7777-777777777777', 'redeemed', '+13472810008', NOW() - INTERVAL '16 days', NOW() - INTERVAL '17 days', NOW() + INTERVAL '30 days'),

  -- Chris's invite code (redeemed by Nina)
  ('a0000009-0000-0000-0000-000000000009', 'CHRI0009', '88888888-8888-8888-8888-888888888888', 'redeemed', '+13472810009', NOW() - INTERVAL '14 days', NOW() - INTERVAL '15 days', NOW() + INTERVAL '30 days'),

  -- Nina's invite code (redeemed by Tyler)
  ('a000000a-0000-0000-0000-00000000000a', 'NINA000A', '99999999-9999-9999-9999-999999999999', 'redeemed', '+13472810010', NOW() - INTERVAL '12 days', NOW() - INTERVAL '13 days', NOW() + INTERVAL '30 days'),

  -- Tyler's invite code (redeemed by Priya)
  ('a000000b-0000-0000-0000-00000000000b', 'TYLE000B', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'redeemed', '+13472810011', NOW() - INTERVAL '10 days', NOW() - INTERVAL '11 days', NOW() + INTERVAL '30 days'),

  -- Priya's invite code (redeemed by Jordan)
  ('a000000c-0000-0000-0000-00000000000c', 'PRIY000C', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'redeemed', '+13472810012', NOW() - INTERVAL '8 days', NOW() - INTERVAL '9 days', NOW() + INTERVAL '30 days'),

  -- Jordan's invite code (redeemed by Samantha)
  ('a000000d-0000-0000-0000-00000000000d', 'JORD000D', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'redeemed', '+13472810013', NOW() - INTERVAL '6 days', NOW() - INTERVAL '7 days', NOW() + INTERVAL '30 days'),

  -- Samantha's invite code (redeemed by Alex T)
  ('a000000e-0000-0000-0000-00000000000e', 'SAMA000E', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'redeemed', '+13472810014', NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days'),

  -- Alex T's invite code (redeemed by Maya)
  ('a000000f-0000-0000-0000-00000000000f', 'ALXT000F', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'redeemed', '+13472810015', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() + INTERVAL '30 days'),

  -- Maya's invite code (redeemed by Ethan)
  ('a0000010-0000-0000-0000-000000000010', 'MAYA0010', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'redeemed', '+13472810016', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() + INTERVAL '30 days'),

  -- Ethan's invite code (redeemed by Olivia)
  ('a0000011-0000-0000-0000-000000000011', 'ETHA0011', '10101010-1010-1010-1010-101010101010', 'redeemed', '+13472810017', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() + INTERVAL '30 days'),

  -- Olivia's invite code (redeemed by Liam)
  ('a0000012-0000-0000-0000-000000000012', 'OLIV0012', '20202020-2020-2020-2020-202020202020', 'redeemed', '+13472810018', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '13 hours', NOW() + INTERVAL '30 days'),

  -- Liam's invite code (redeemed by Zoe)
  ('a0000013-0000-0000-0000-000000000013', 'LIAM0013', '30303030-3030-3030-3030-303030303030', 'redeemed', '+13472810019', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '7 hours', NOW() + INTERVAL '30 days');

-- ============================================================================
-- FRIENDSHIPS (Moderately connected: 3-7 friends per user)
-- ============================================================================
-- Pattern: Each user is friends with:
-- 1. Their inviter (automatic from signup)
-- 2. 2-6 other users (mix of nearby in chain + some random)

INSERT INTO public.friendships (id, user_a, user_b, requested_by, status, accepted_at, created_at, updated_at)
VALUES
  -- Alex Korman's friendships (Alex is user_a for all since their ID is smallest)
  ('f0000001-0000-0000-0000-000000000001', 'b6b50501-a70f-4954-a2de-c800bfc867e4', '11111111-1111-1111-1111-111111111111', 'b6b50501-a70f-4954-a2de-c800bfc867e4', 'accepted', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('f0000002-0000-0000-0000-000000000002', 'b6b50501-a70f-4954-a2de-c800bfc867e4', '22222222-2222-2222-2222-222222222222', 'b6b50501-a70f-4954-a2de-c800bfc867e4', 'accepted', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
  ('f0000003-0000-0000-0000-000000000003', 'b6b50501-a70f-4954-a2de-c800bfc867e4', '33333333-3333-3333-3333-333333333333', 'b6b50501-a70f-4954-a2de-c800bfc867e4', 'accepted', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),
  ('f0000004-0000-0000-0000-000000000004', 'b6b50501-a70f-4954-a2de-c800bfc867e4', '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),

  -- Sarah Chen (11111111...) friendships
  ('f0000005-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
  ('f0000006-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'accepted', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),
  ('f0000007-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
  ('f0000008-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),

  -- Marcus Johnson (22222222...) friendships
  ('f0000009-0000-0000-0000-000000000009', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),
  ('f000000a-0000-0000-0000-00000000000a', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'accepted', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
  ('f000000b-0000-0000-0000-00000000000b', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
  ('f000000c-0000-0000-0000-00000000000c', '22222222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'accepted', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

  -- Emily Rodriguez (33333333...) friendships
  ('f000000d-0000-0000-0000-00000000000d', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
  ('f000000e-0000-0000-0000-00000000000e', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'accepted', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
  ('f000000f-0000-0000-0000-00000000000f', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('f0000010-0000-0000-0000-000000000010', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'accepted', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

  -- David Kim (44444444...) friendships
  ('f0000011-0000-0000-0000-000000000011', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
  ('f0000012-0000-0000-0000-000000000012', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'accepted', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('f0000013-0000-0000-0000-000000000013', '44444444-4444-4444-4444-444444444444', '88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'accepted', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),

  -- Jessica Martinez (55555555...) friendships
  ('f0000014-0000-0000-0000-000000000014', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('f0000015-0000-0000-0000-000000000015', '55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', 'accepted', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
  ('f0000016-0000-0000-0000-000000000016', '55555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

  -- Ryan O'Connor (66666666...) friendships
  ('f0000017-0000-0000-0000-000000000017', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
  ('f0000018-0000-0000-0000-000000000018', '66666666-6666-6666-6666-666666666666', '88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', 'accepted', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
  ('f0000019-0000-0000-0000-000000000019', '66666666-6666-6666-6666-666666666666', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

  -- Aisha Patel (77777777...) friendships
  ('f000001a-0000-0000-0000-00000000001a', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
  ('f000001b-0000-0000-0000-00000000001b', '77777777-7777-7777-7777-777777777777', '99999999-9999-9999-9999-999999999999', '77777777-7777-7777-7777-777777777777', 'accepted', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
  ('f000001c-0000-0000-0000-00000000001c', '77777777-7777-7777-7777-777777777777', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'accepted', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

  -- Chris Anderson (88888888...) friendships
  ('f000001d-0000-0000-0000-00000000001d', '88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888888', 'accepted', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
  ('f000001e-0000-0000-0000-00000000001e', '88888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', 'accepted', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ('f000001f-0000-0000-0000-00000000001f', '88888888-8888-8888-8888-888888888888', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'accepted', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

  -- Nina Kowalski (99999999...) friendships
  ('f0000020-0000-0000-0000-000000000020', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', 'accepted', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ('f0000021-0000-0000-0000-000000000021', '99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '99999999-9999-9999-9999-999999999999', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('f0000022-0000-0000-0000-000000000022', '99999999-9999-9999-9999-999999999999', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'accepted', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

  -- Tyler Brooks (aaaaaaaa...) friendships
  ('f0000023-0000-0000-0000-000000000023', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'accepted', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('f0000024-0000-0000-0000-000000000024', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('f0000025-0000-0000-0000-000000000025', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '10101010-1010-1010-1010-101010101010', '10101010-1010-1010-1010-101010101010', 'accepted', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

  -- Priya Sharma (bbbbbbbb...) friendships
  ('f0000026-0000-0000-0000-000000000026', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'accepted', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('f0000027-0000-0000-0000-000000000027', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'accepted', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ('f0000028-0000-0000-0000-000000000028', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '20202020-2020-2020-2020-202020202020', '20202020-2020-2020-2020-202020202020', 'accepted', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

  -- Jordan Lee (cccccccc...) friendships
  ('f0000029-0000-0000-0000-000000000029', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'accepted', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ('f000002a-0000-0000-0000-00000000002a', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'accepted', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('f000002b-0000-0000-0000-00000000002b', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '30303030-3030-3030-3030-303030303030', '30303030-3030-3030-3030-303030303030', 'accepted', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),

  -- Samantha Wu (dddddddd...) friendships
  ('f000002c-0000-0000-0000-00000000002c', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'accepted', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('f000002d-0000-0000-0000-00000000002d', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'accepted', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('f000002e-0000-0000-0000-00000000002e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '40404040-4040-4040-4040-404040404040', '40404040-4040-4040-4040-404040404040', 'accepted', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),

  -- Alex Thompson (eeeeeeee...) friendships
  ('f000002f-0000-0000-0000-00000000002f', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'accepted', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('f0000030-0000-0000-0000-000000000030', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '10101010-1010-1010-1010-101010101010', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'accepted', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

  -- Maya Jackson (ffffffff...) friendships
  ('f0000031-0000-0000-0000-000000000031', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '10101010-1010-1010-1010-101010101010', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'accepted', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('f0000032-0000-0000-0000-000000000032', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '20202020-2020-2020-2020-202020202020', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'accepted', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

  -- Ethan Davis (10101010...) friendships
  ('f0000033-0000-0000-0000-000000000033', '10101010-1010-1010-1010-101010101010', '20202020-2020-2020-2020-202020202020', '10101010-1010-1010-1010-101010101010', 'accepted', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('f0000034-0000-0000-0000-000000000034', '10101010-1010-1010-1010-101010101010', '30303030-3030-3030-3030-303030303030', '10101010-1010-1010-1010-101010101010', 'accepted', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),

  -- Olivia Brown (20202020...) friendships
  ('f0000035-0000-0000-0000-000000000035', '20202020-2020-2020-2020-202020202020', '30303030-3030-3030-3030-303030303030', '20202020-2020-2020-2020-202020202020', 'accepted', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),
  ('f0000036-0000-0000-0000-000000000036', '20202020-2020-2020-2020-202020202020', '40404040-4040-4040-4040-404040404040', '20202020-2020-2020-2020-202020202020', 'accepted', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),

  -- Liam Garcia (30303030...) friendships
  ('f0000037-0000-0000-0000-000000000037', '30303030-3030-3030-3030-303030303030', '40404040-4040-4040-4040-404040404040', '30303030-3030-3030-3030-303030303030', 'accepted', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours');

-- Zoe Miller (40404040...) has 3 friendships already via above entries

-- ============================================================================
-- VIBES (One vibe per friendship, linked to invite codes)
-- ============================================================================
-- Each friendship has accompanying vibes from inviter to invitee

INSERT INTO public.vibes (id, giver_id, receiver_id, emojis, invite_code_id, created_at, updated_at)
VALUES
  -- Alex → Sarah (via invite)
  ('b0000001-0000-0000-0000-000000000001', 'b6b50501-a70f-4954-a2de-c800bfc867e4', '11111111-1111-1111-1111-111111111111', ARRAY['👋', '🎉', '🌟'], 'a0000001-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),

  -- Sarah → Marcus (via invite)
  ('b0000002-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', ARRAY['🚀', '💫', '✨'], 'a0000002-0000-0000-0000-000000000002', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),

  -- Marcus → Emily (via invite)
  ('b0000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', ARRAY['🌈', '🎨', '🎭'], 'a0000003-0000-0000-0000-000000000003', NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days'),

  -- Emily → David (via invite)
  ('b0000004-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', ARRAY['🎯', '⚡', '🔥'], 'a0000004-0000-0000-0000-000000000004', NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),

  -- David → Jessica (via invite)
  ('b0000005-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', ARRAY['🌺', '🌸', '🌻'], 'a0000005-0000-0000-0000-000000000005', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),

  -- Jessica → Ryan (via invite)
  ('b0000006-0000-0000-0000-000000000006', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', ARRAY['🎸', '🎵', '🎶'], 'a0000006-0000-0000-0000-000000000006', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),

  -- Ryan → Aisha (via invite)
  ('b0000007-0000-0000-0000-000000000007', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', ARRAY['🌙', '⭐', '🌠'], 'a0000007-0000-0000-0000-000000000007', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),

  -- Aisha → Chris (via invite)
  ('b0000008-0000-0000-0000-000000000008', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', ARRAY['🏔️', '🌲', '🏕️'], 'a0000008-0000-0000-0000-000000000008', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),

  -- Chris → Nina (via invite)
  ('b0000009-0000-0000-0000-000000000009', '88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', ARRAY['🌊', '🏄', '🌴'], 'a0000009-0000-0000-0000-000000000009', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

  -- Nina → Tyler (via invite)
  ('b000000a-0000-0000-0000-00000000000a', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ARRAY['🎤', '🎧', '🎼'], 'a000000a-0000-0000-0000-00000000000a', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

  -- Tyler → Priya (via invite)
  ('b000000b-0000-0000-0000-00000000000b', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', ARRAY['📚', '✏️', '📖'], 'a000000b-0000-0000-0000-00000000000b', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

  -- Priya → Jordan (via invite)
  ('b000000c-0000-0000-0000-00000000000c', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', ARRAY['⚽', '🏀', '🎾'], 'a000000c-0000-0000-0000-00000000000c', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

  -- Jordan → Samantha (via invite)
  ('b000000d-0000-0000-0000-00000000000d', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', ARRAY['🍕', '🍔', '🌮'], 'a000000d-0000-0000-0000-00000000000d', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

  -- Samantha → Alex T (via invite)
  ('b000000e-0000-0000-0000-00000000000e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', ARRAY['🎮', '🕹️', '👾'], 'a000000e-0000-0000-0000-00000000000e', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

  -- Alex T → Maya (via invite)
  ('b000000f-0000-0000-0000-00000000000f', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff', ARRAY['🎬', '📽️', '🎞️'], 'a000000f-0000-0000-0000-00000000000f', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

  -- Maya → Ethan (via invite)
  ('b0000010-0000-0000-0000-000000000010', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '10101010-1010-1010-1010-101010101010', ARRAY['☕', '🍰', '🧁'], 'a0000010-0000-0000-0000-000000000010', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

  -- Ethan → Olivia (via invite)
  ('b0000011-0000-0000-0000-000000000011', '10101010-1010-1010-1010-101010101010', '20202020-2020-2020-2020-202020202020', ARRAY['🌅', '🏖️', '🌺'], 'a0000011-0000-0000-0000-000000000011', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

  -- Olivia → Liam (via invite)
  ('b0000012-0000-0000-0000-000000000012', '20202020-2020-2020-2020-202020202020', '30303030-3030-3030-3030-303030303030', ARRAY['🎲', '🃏', '🎰'], 'a0000012-0000-0000-0000-000000000012', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),

  -- Liam → Zoe (via invite)
  ('b0000013-0000-0000-0000-000000000013', '30303030-3030-3030-3030-303030303030', '40404040-4040-4040-4040-404040404040', ARRAY['🌿', '🍃', '🌱'], 'a0000013-0000-0000-0000-000000000013', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),

  -- Additional vibes (not linked to invites, organic friendships)
  ('b0000014-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111', 'b6b50501-a70f-4954-a2de-c800bfc867e4', ARRAY['❤️', '🙏', '😊'], NULL, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
  ('b0000015-0000-0000-0000-000000000015', '22222222-2222-2222-2222-222222222222', 'b6b50501-a70f-4954-a2de-c800bfc867e4', ARRAY['💪', '🤝', '👊'], NULL, NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
  ('b0000016-0000-0000-0000-000000000016', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', ARRAY['🌟', '💝', '🎁'], NULL, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ('b0000017-0000-0000-0000-000000000017', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', ARRAY['🎊', '🎈', '🎀'], NULL, NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days'),
  ('b0000018-0000-0000-0000-000000000018', '55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', ARRAY['🌻', '🦋', '🐝'], NULL, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days');

-- ============================================================================
-- RESTORE FOREIGN KEY CONSTRAINT
-- ============================================================================
-- Restore the foreign key constraint between profiles and auth.users
-- Using NOT VALID to skip validation of existing rows (our seed data)

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE
  NOT VALID;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total inserted:
--   - 19 profiles
--   - 19 invite codes (all redeemed)
--   - 55 friendships (all accepted, moderately connected network)
--   - 23 vibes (19 linked to invites + 4 organic)
--
-- Rollback: Use the corresponding rollback migration file
-- ============================================================================

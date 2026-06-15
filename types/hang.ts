import { PostVisibility } from "./post";

export interface HangAuthor {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface Hang {
  id: string;
  user_id: string; // host
  title: string;
  description: string | null;
  location: string; // PostGIS POINT format: "POINT(lng lat)"
  location_name: string;
  starts_at: string; // ISO timestamptz
  post_id: string | null;
  created_at: string;
  updated_at: string;
}

// Row of get_active_hang_locations (map display)
export interface HangMapLocation {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  title: string;
  location_name: string;
  starts_at: string;
  longitude: number;
  latitude: number;
  type: "own" | "friend" | "mutual";
  attendee_count: number;
}

// Row of get_hang_detail
export interface HangDetail {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location_name: string;
  longitude: number;
  latitude: number;
  starts_at: string;
  post_id: string | null;
  host: HangAuthor;
  attendees: HangAuthor[];
  attendee_count: number;
  viewer_is_going: boolean;
  viewer_is_host: boolean;
}

// Embedded `hang` JSONB on a feed/saved post (see get_feed_posts)
export interface HangFeedEmbed {
  id: string;
  title: string;
  description: string | null;
  location_name: string;
  longitude: number;
  latitude: number;
  starts_at: string;
  attendee_count: number;
  viewer_is_going: boolean;
  // Up to 3 attendee avatars for the feed-card stack
  attendees: { full_name: string; avatar_url: string | null }[];
}

// Input DTOs
export interface CreateHangInput {
  location: {
    longitude: number;
    latitude: number;
    name: string;
  };
  title: string;
  description?: string;
  starts_at: string; // ISO timestamptz
  post_visibility?: PostVisibility; // defaults to 'mutuals'
}

export interface UpdateHangInput extends CreateHangInput {
  hang_id: string;
}

// Output DTO (create/update RPCs return an array; caller reads [0])
export interface CreateHangOutput {
  hang_id: string;
  post_id: string;
  title: string;
  starts_at: string;
}

export interface GetHangLocationsOutput {
  data: HangMapLocation[];
}

// Category type for lists
export type ListCategory =
  | "nightlife"
  | "eat_drink"
  | "activities"
  | "explore"
  | "shop"
  | "work";

// Core types
export interface List {
  id: string;
  user_id: string;
  title: string;
  category: ListCategory;
  location_name: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaceAlternative {
  resolved_name: string;
  latitude: number;
  longitude: number;
  confidence: number;
}

export interface ListPlace {
  id: string;
  list_id: string;
  original_text: string;
  resolved_name: string;
  longitude: number | null;
  latitude: number | null;
  confidence: number | null;
  status: "resolved" | "ambiguous" | "unresolved";
  alternatives: PlaceAlternative[];
  position: number;
  created_at: string;
  updated_at: string;
}

// Extended types for display
export interface ListWithPlaces extends List {
  places: ListPlace[];
}

// List with owner info for picker display
export interface ViewableList extends ListWithPlaces {
  owner_name: string;
}

// LLM Response schema (matches required JSON output)
export interface LLMPlaceResolution {
  original_text: string;
  resolved_name: string;
  latitude: number;
  longitude: number;
  confidence: number;
  status: "resolved" | "ambiguous";
  alternatives: PlaceAlternative[];
}

// Input DTOs
export interface CreateListInput {
  title: string;
  category: ListCategory;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  places: string[];
  note?: string;
}

export interface UpdateListInput {
  list_id: string;
  title?: string;
  category?: ListCategory;
  note?: string;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

export interface AddPlacesToListInput {
  list_id: string;
  places: string[];
}

export interface RemovePlaceInput {
  place_id: string;
}

export interface ReorderPlacesInput {
  list_id: string;
  place_ids: string[];
}

export interface UpdatePlaceInput {
  place_id: string;
  resolved_name?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  confidence?: number;
  status?: "resolved" | "ambiguous" | "unresolved";
  alternatives?: PlaceAlternative[];
}

// Pagination
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

// Output DTOs
export interface CreateListOutput {
  list: List;
  places: ListPlace[];
}

export interface GetListsOutput {
  data: ListWithPlaces[];
  total: number;
}

export interface GetViewableListsOutput {
  data: ViewableList[];
  total: number;
}

export interface GetListOutput {
  data: ListWithPlaces | null;
}

// Edge function types
export interface ResolvePlacesInput {
  location_name: string;
  places: string[];
}

export interface ResolvePlacesOutput {
  success: boolean;
  resolved_places: LLMPlaceResolution[];
  errors?: string[];
}

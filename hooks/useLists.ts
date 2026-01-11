import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import {
  List,
  ListPlace,
  ListWithPlaces,
  CreateListInput,
  CreateListOutput,
  UpdateListInput,
  AddPlacesToListInput,
  GetListsOutput,
  GetListOutput,
  ResolvePlacesOutput,
  ReorderPlacesInput,
  UpdatePlaceInput,
  PlaceAlternative,
  PaginationOptions,
} from "@/types/list";

export const useLists = () => {
  const { isLoaded, supabase } = useSupabase();
  const profile = useRequireProfile();

  // ––– QUERIES –––

  const fetchListPlaces = async (listId: string): Promise<ListPlace[]> => {
      const { data, error } = await supabase.rpc(
        "get_list_places_with_coordinates",
        { p_list_id: listId }
      );

      if (error) {
        throw new Error(
          `Failed to fetch places for list ${listId}: ${error.message}`
        );
      }

    return (data || []) as ListPlace[];
  };

  const getLists = async (
    userId?: string,
    options?: PaginationOptions
  ): Promise<GetListsOutput> => {
      const targetUserId = userId ?? profile.id;

      const { data: listsWithPlaces, error } = await supabase.rpc(
        "get_lists_with_places",
        {
          p_user_id: targetUserId,
          p_limit: options?.limit ?? null,
          p_offset: options?.offset ?? 0,
        }
      );

      if (error) {
        throw new Error(
          `Failed to fetch lists for user ${targetUserId}: ${error.message}`
        );
      }

      // Extract total from first row (all rows have same total)
      const total = listsWithPlaces?.[0]?.total_count ?? 0;

      // Transform JSONB places to typed arrays and handle location object
      const typedLists: ListWithPlaces[] = (listsWithPlaces || []).map(
        (list: any) => ({
          ...list,
          location:
            list.longitude && list.latitude
              ? { longitude: list.longitude, latitude: list.latitude }
              : null,
          places: (list.places as unknown as ListPlace[]) || [],
        })
      );

    return { data: typedLists, total };
  };

  const getList = async (listId: string): Promise<GetListOutput> => {
      const { data: list, error: listError } = await supabase
        .from("lists")
        .select("*")
        .eq("id", listId)
        .maybeSingle();

      if (listError) {
        throw new Error(`Failed to fetch list ${listId}: ${listError.message}`);
      }
      if (!list) return { data: null };

      const places = await fetchListPlaces(listId);

    return {
      data: {
        ...list,
        places,
      },
    };
  };

  // ––– MUTATIONS –––

  const createList = async (input: CreateListInput): Promise<CreateListOutput> => {
      const { title, location, places: inputPlaces } = input;

      // Step 1: Resolve places via Edge Function
      const { data: resolveData, error: resolveError } =
        await supabase.functions.invoke("resolve-list-places", {
          body: {
            list_title: title,
            location_name: location.name,
            places: inputPlaces,
            user_lat: profile.latitude,
            user_lng: profile.longitude,
          },
        });

      if (resolveError) {
        throw new Error(
          `Failed to resolve places for list "${title}": ${resolveError.message}`
        );
      }

      if (!resolveData) {
        throw new Error(
          `Failed to resolve places for list "${title}": No response from server`
        );
      }

      if (!resolveData.success) {
        throw new Error(
          resolveData.error || `Place resolution failed for list "${title}"`
        );
      }

      const resolvedPlaces: ResolvePlacesOutput["resolved_places"] =
        resolveData.resolved_places;

      // Step 2: Create list
      const { data: list, error: listError } = await supabase
        .from("lists")
        .insert({
          user_id: profile.id,
          title,
          location_name: location.name,
          location: `POINT(${location.longitude} ${location.latitude})`,
        })
        .select()
        .single();

      if (listError) {
        throw new Error(
          `Failed to create list "${title}": ${listError.message}`
        );
      }

      // Step 3: Insert places
      const placesToInsert = resolvedPlaces.map((place, index) => ({
        list_id: list.id,
        original_text: place.original_text,
        resolved_name: place.resolved_name,
        location:
          place.latitude && place.longitude
            ? `POINT(${place.longitude} ${place.latitude})`
            : null,
        confidence: place.confidence,
        status: place.status,
        alternatives: place.alternatives || [],
        position: index,
      }));

      const { error: placesError } = await supabase
        .from("list_places")
        .insert(placesToInsert);

      if (placesError) {
        throw new Error(
          `Failed to insert places for list "${title}": ${placesError.message}`
        );
      }

      // Fetch places with coordinates using helper
      const places = await fetchListPlaces(list.id);

    return {
      list,
      places,
    };
  };

  const updateList = async (input: UpdateListInput): Promise<List> => {
      const { list_id, title, location } = input;

      interface ListUpdateFields {
        title: string;
        location_name: string;
        location: string;
      }

      const updates: Partial<ListUpdateFields> = {};
      if (title !== undefined) updates.title = title;
      if (location !== undefined) {
        updates.location_name = location.name;
        updates.location = `POINT(${location.longitude} ${location.latitude})`;
      }

      const { data, error } = await supabase
        .from("lists")
        .update(updates)
        .eq("id", list_id)
        .eq("user_id", profile.id)
        .select()
        .single();

    if (error) {
      throw new Error(`Failed to update list ${list_id}: ${error.message}`);
    }
    return data;
  };

  /**
   * Add new places to an existing list.
   * Calculates next position based on existing places, resolves new places
   * via Edge Function, and inserts them at the end of the list.
   *
   * @param input - List ID and array of place names to add
   * @returns Promise resolving to all places in the list (including newly added)
   * @throws Error if resolution fails, list not found, or user is unauthorized
   */
  const addPlacesToList = async (input: AddPlacesToListInput): Promise<ListPlace[]> => {
      const { list_id, places: inputPlaces } = input;

      // Get existing list for context
      const { data: existingList } = await getList(list_id);
      if (!existingList) {
        throw new Error(`List ${list_id} not found`);
      }

      // Get current max position
      const maxPosition = Math.max(
        0,
        ...existingList.places.map((p) => p.position)
      );

      // Resolve new places
      const { data: resolveData, error: resolveError } =
        await supabase.functions.invoke("resolve-list-places", {
          body: {
            list_title: existingList.title,
            location_name: existingList.location_name,
            places: inputPlaces,
            user_lat: profile.latitude,
            user_lng: profile.longitude,
          },
        });

      if (resolveError || !resolveData?.success) {
        throw new Error(
          `Failed to resolve places for list ${list_id}: ${
            resolveError?.message || "Unknown error"
          }`
        );
      }

      // Insert new places
      const placesToInsert = resolveData.resolved_places.map(
        (place: any, index: number) => ({
          list_id,
          original_text: place.original_text,
          resolved_name: place.resolved_name,
          location:
            place.latitude && place.longitude
              ? `POINT(${place.longitude} ${place.latitude})`
              : null,
          confidence: place.confidence,
          status: place.status,
          alternatives: place.alternatives || [],
          position: maxPosition + index + 1,
        })
      );

      const { error } = await supabase
        .from("list_places")
        .insert(placesToInsert);

      if (error) {
        throw new Error(
          `Failed to add places to list ${list_id}: ${error.message}`
        );
      }

    // Re-fetch places with coordinates using helper
    return await fetchListPlaces(list_id);
  };

  const reorderPlaces = async (input: ReorderPlacesInput): Promise<void> => {
      const { list_id, place_ids } = input;

      // Convert array of IDs to JSONB array of {place_id, position} objects
      const placePositions = place_ids.map((place_id, index) => ({
        place_id,
        position: index,
      }));

      const { error } = await supabase.rpc("reorder_list_places", {
        p_list_id: list_id,
        p_place_positions: placePositions,
      });

    if (error) {
      throw new Error(
        `Failed to reorder places in list ${list_id}: ${error.message}`
      );
    }
  };

  const updatePlace = async (input: UpdatePlaceInput): Promise<ListPlace> => {
      const {
        place_id,
        resolved_name,
        location,
        confidence,
        status,
        alternatives,
      } = input;

      interface PlaceUpdateFields {
        resolved_name: string;
        location: string;
        confidence: number;
        status: string;
        alternatives: PlaceAlternative[];
        updated_at: string;
      }

      const updates: Partial<PlaceUpdateFields> = {
        updated_at: new Date().toISOString(),
      };

      if (resolved_name !== undefined) updates.resolved_name = resolved_name;
      if (location !== undefined) {
        updates.location = `POINT(${location.longitude} ${location.latitude})`;
      }
      if (confidence !== undefined) updates.confidence = confidence;
      if (status !== undefined) updates.status = status;
      if (alternatives !== undefined) updates.alternatives = alternatives;

      const { data, error } = await supabase
        .from("list_places")
        .update(updates)
        .eq("id", place_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update place ${place_id}: ${error.message}`);
      }

      // Re-fetch to get extracted coordinates
      const places = await fetchListPlaces(data.list_id);
      const updatedPlace = places.find((p) => p.id === place_id);

    if (!updatedPlace) {
      throw new Error(`Updated place ${place_id} not found in refetch`);
    }

    return updatedPlace;
  };

  const removePlace = async (placeId: string): Promise<void> => {
      const { error } = await supabase
        .from("list_places")
        .delete()
        .eq("id", placeId);

    if (error) {
      throw new Error(`Failed to remove place ${placeId}: ${error.message}`);
    }
  };

  const deleteList = async (listId: string): Promise<void> => {
      const { error } = await supabase
        .from("lists")
        .delete()
        .eq("id", listId)
        .eq("user_id", profile.id);

    if (error) {
      throw new Error(`Failed to delete list ${listId}: ${error.message}`);
    }
  };

  return {
    isLoaded,
    // Queries
    getList,
    getLists,
    // Mutations
    createList,
    updateList,
    addPlacesToList,
    reorderPlaces,
    updatePlace,
    removePlace,
    deleteList,
  };
};

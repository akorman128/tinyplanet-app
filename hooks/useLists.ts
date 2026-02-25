import { useCallback } from "react";
import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { parsePostGISPoint } from "@/utils/postgis";
import {
  List,
  ListPlace,
  ListLocation,
  ListWithPlaces,
  ViewableList,
  CreateListInput,
  CreateListOutput,
  UpdateListInput,
  AddPlacesToListInput,
  GetListsOutput,
  GetListOutput,
  GetViewableListsOutput,
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
    console.log("[getList] Fetching list:", listId, "profile.id:", profile.id);
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select("*")
      .eq("id", listId)
      .maybeSingle();

    console.log("[getList] Result:", { list, listError });
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

  /**
   * Get all lists the user can view (own lists + friends' lists).
   * Used for the list picker when attaching lists to posts/comments.
   */
  const getViewableLists = async (): Promise<GetViewableListsOutput> => {
    // Get own lists
    const { data: ownLists, error: ownError } = await supabase
      .from("lists")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (ownError) {
      throw new Error(`Failed to fetch own lists: ${ownError.message}`);
    }

    // Get friends' lists (RLS will handle the filtering via existing policies)
    const { data: friendLists, error: friendError } = await supabase
      .from("lists")
      .select(
        `
        *,
        owner:profiles!lists_user_id_fkey(id, full_name)
      `
      )
      .neq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (friendError) {
      throw new Error(`Failed to fetch friends' lists: ${friendError.message}`);
    }

    // Transform own lists
    const transformedOwnLists: ViewableList[] = (ownLists || []).map(
      (list: any) => ({
        ...list,
        location: typeof list.location === "string" ? parsePostGISPoint(list.location) : null,
        places: [], // Empty for picker (we don't need full places)
        owner_name: "You",
      })
    );

    // Transform friends' lists
    const transformedFriendLists: ViewableList[] = (friendLists || []).map(
      (list: any) => ({
        ...list,
        location: typeof list.location === "string" ? parsePostGISPoint(list.location) : null,
        places: [],
        owner_name: list.owner?.full_name || "Unknown",
      })
    );

    // Combine all lists (own lists first)
    const allLists = [...transformedOwnLists, ...transformedFriendLists];

    return {
      data: allLists,
      total: allLists.length,
    };
  };

  /**
   * Get list locations for the map via server-side coordinate extraction.
   * Returns own lists + friends' lists with proper longitude/latitude.
   */
  const getListLocations = useCallback(async (): Promise<ListLocation[]> => {
    const { data, error } = await supabase.rpc(
      "get_viewable_list_locations",
      { p_user_id: profile.id }
    );

    if (error) {
      throw new Error(`Failed to fetch list locations: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      location_name: row.location_name,
      location: { longitude: row.longitude, latitude: row.latitude },
      owner_name: row.owner_name,
    }));
  }, [supabase, profile.id]);

  // ––– MUTATIONS –––

  const createList = async (
    input: CreateListInput
  ): Promise<CreateListOutput> => {
    const {
      title,
      category,
      location,
      note,
      places: inputPlaces,
      freeform_text,
    } = input;

    let resolvedPlaces: ResolvePlacesOutput["resolved_places"] = [];

    // Step 1: Resolve places via Edge Function
    if (freeform_text || (inputPlaces && inputPlaces.length > 0)) {
      const { data: resolveData, error: resolveError } =
        await supabase.functions.invoke("resolve-list-places", {
          body: {
            location_name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            title,
            category,
            ...(freeform_text
              ? { freeform_text }
              : { places: inputPlaces }),
          },
        });

      if (resolveError) {
        throw new Error(
          `Failed to resolve places for list "${title}": ${resolveError.message}`
        );
      }

      resolvedPlaces = resolveData.resolved_places;
    }

    // Step 2: Create list
    const { data: list, error: listError } = await supabase
      .from("lists")
      .insert({
        user_id: profile.id,
        title,
        category,
        location_name: location.name,
        location: `POINT(${location.longitude} ${location.latitude})`,
        note: note || null,
      })
      .select()
      .single();

    if (listError) {
      throw new Error(`Failed to create list "${title}": ${listError.message}`);
    }

    // Step 3: Insert places (only if there are resolved places)
    if (resolvedPlaces.length > 0) {
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
    }

    // Fetch places with coordinates using helper
    const places = await fetchListPlaces(list.id);

    return {
      list,
      places,
    };
  };

  const updateList = async (input: UpdateListInput): Promise<List> => {
    const { list_id, title, category, note, location } = input;

    interface ListUpdateFields {
      title: string;
      category: string;
      note: string | null;
      location_name: string;
      location: string;
    }

    const updates: Partial<ListUpdateFields> = {};
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (note !== undefined) updates.note = note || null;
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

  const subscribeToListCreation = useCallback(
    (onListCreated: () => void) => {
      const channel = supabase
        .channel("my-lists")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "lists",
            filter: `user_id=eq.${profile.id}`,
          },
          () => {
            onListCreated();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [supabase, profile.id]
  );

  return {
    isLoaded,
    // Queries
    getList,
    getLists,
    getViewableLists,
    getListLocations,
    // Subscriptions
    subscribeToListCreation,
    // Mutations
    createList,
    updateList,
    updatePlace,
    removePlace,
    deleteList,
  };
};

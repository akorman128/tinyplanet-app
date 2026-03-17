import { useCallback } from "react";
import { useQuery, UseQueryResult, useMutation, useQueryClient } from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { parsePostGISPoint } from "@/utils/postgis";
import { queryKeys } from "@/lib/queryKeys";
import {
  List,
  ListCategory,
  ListPlace,
  ListLocation,
  ListWithPlaces,
  ViewableList,
  CreateListInput,
  CreateListOutput,
  UpdateListInput,
  GetListsOutput,
  GetListOutput,
  GetViewableListsOutput,
  ResolvePlacesOutput,
  UpdatePlaceInput,
  PlaceAlternative,
  PaginationOptions,
} from "@/types/list";

// --- Mutation hooks ---

export const useCreateList = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateListInput): Promise<CreateListOutput> => {
      const { title, category, location, note, places: inputPlaces, freeform_text } = input;

      let resolvedPlaces: ResolvePlacesOutput["resolved_places"] = [];

      if (freeform_text || (inputPlaces && inputPlaces.length > 0)) {
        const { data: resolveData, error: resolveError } = await supabase.functions.invoke("resolve-list-places", {
          body: {
            location_name: location.name, latitude: location.latitude, longitude: location.longitude,
            title, category,
            ...(freeform_text ? { freeform_text } : { places: inputPlaces }),
          },
        });
        if (resolveError) throw new Error(`Failed to resolve places for list "${title}": ${resolveError.message}`);
        resolvedPlaces = resolveData.resolved_places;
      }

      const { data: list, error: listError } = await supabase
        .from("lists")
        .insert({ user_id: profile.id, title, category, location_name: location.name, location: `POINT(${location.longitude} ${location.latitude})`, note: note || null })
        .select()
        .single();

      if (listError) throw new Error(`Failed to create list "${title}": ${listError.message}`);

      if (resolvedPlaces.length > 0) {
        const placesToInsert = resolvedPlaces.map((place, index) => ({
          list_id: list.id, original_text: place.original_text, resolved_name: place.resolved_name,
          location: place.latitude && place.longitude ? `POINT(${place.longitude} ${place.latitude})` : null,
          confidence: place.confidence, status: place.status, alternatives: place.alternatives || [], position: index,
        }));
        const { error: placesError } = await supabase.from("list_places").insert(placesToInsert);
        if (placesError) throw new Error(`Failed to insert places for list "${title}": ${placesError.message}`);
      }

      const { data: placesData } = await supabase.rpc("get_list_places_with_coordinates", { p_list_id: list.id });
      return { list, places: (placesData || []) as ListPlace[] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
    },
  });
};

export const useUpdateList = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateListInput): Promise<List> => {
      const { list_id, title, category, note, location } = input;

      interface ListUpdateFields { title: string; category: string; note: string | null; location_name: string; location: string; }
      const updates: Partial<ListUpdateFields> = {};
      if (title !== undefined) updates.title = title;
      if (category !== undefined) updates.category = category;
      if (note !== undefined) updates.note = note || null;
      if (location !== undefined) {
        updates.location_name = location.name;
        updates.location = `POINT(${location.longitude} ${location.latitude})`;
      }

      const { data, error } = await supabase.from("lists").update(updates).eq("id", list_id).eq("user_id", profile.id).select().single();
      if (error) throw new Error(`Failed to update list ${list_id}: ${error.message}`);
      return data;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.detail(input.list_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
    },
  });
};

export const useUpdatePlace = () => {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePlaceInput): Promise<ListPlace> => {
      const { place_id, resolved_name, location, confidence, status, alternatives } = input;

      interface PlaceUpdateFields { resolved_name: string; location: string; confidence: number; status: string; alternatives: PlaceAlternative[]; updated_at: string; }
      const updates: Partial<PlaceUpdateFields> = { updated_at: new Date().toISOString() };

      if (resolved_name !== undefined) updates.resolved_name = resolved_name;
      if (location !== undefined) updates.location = `POINT(${location.longitude} ${location.latitude})`;
      if (confidence !== undefined) updates.confidence = confidence;
      if (status !== undefined) updates.status = status;
      if (alternatives !== undefined) updates.alternatives = alternatives;

      const { data, error } = await supabase.from("list_places").update(updates).eq("id", place_id).select().single();
      if (error) throw new Error(`Failed to update place ${place_id}: ${error.message}`);

      const { data: placesData } = await supabase.rpc("get_list_places_with_coordinates", { p_list_id: data.list_id });
      const updatedPlace = (placesData as ListPlace[])?.find((p) => p.id === place_id);
      if (!updatedPlace) throw new Error(`Updated place ${place_id} not found in refetch`);
      return updatedPlace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
    },
  });
};

export const useRemovePlace = () => {
  const { supabase } = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (placeId: string) => {
      const { error } = await supabase.from("list_places").delete().eq("id", placeId);
      if (error) throw new Error(`Failed to remove place ${placeId}: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
    },
  });
};

export const useDeleteList = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase.from("lists").delete().eq("id", listId).eq("user_id", profile.id);
      if (error) throw new Error(`Failed to delete list ${listId}: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
    },
  });
};

// --- Query hooks ---

export const useGetList = (listId?: string): UseQueryResult<GetListOutput> => {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.lists.detail(listId!),
    queryFn: async () => {
      const { data: list, error: listError } = await supabase.from("lists").select("*").eq("id", listId!).maybeSingle();
      if (listError) throw new Error(`Failed to fetch list ${listId}: ${listError.message}`);
      if (!list) return { data: null };
      const { data: placesData, error: placesError } = await supabase.rpc("get_list_places_with_coordinates", { p_list_id: listId! });
      if (placesError) throw new Error(`Failed to fetch places for list ${listId}: ${placesError.message}`);
      return { data: { ...list, places: (placesData || []) as ListPlace[] } };
    },
    enabled: !!listId,
  });
};

export const useGetLists = (userId?: string): UseQueryResult<GetListsOutput> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const targetUserId = userId ?? profile.id;

  return useQuery({
    queryKey: queryKeys.lists.byUser(targetUserId),
    queryFn: async () => {
      interface ListWithPlacesRow {
        id: string;
        user_id: string;
        title: string;
        category: ListCategory;
        location_name: string;
        note: string | null;
        created_at: string;
        updated_at: string;
        longitude: number | null;
        latitude: number | null;
        places: ListPlace[];
        total_count: number;
      }
      const { data: rawData, error } = await supabase.rpc("get_lists_with_places", {
        p_user_id: targetUserId, p_limit: null, p_offset: 0,
      });
      if (error) throw new Error(`Failed to fetch lists for user ${targetUserId}: ${error.message}`);
      const listsWithPlaces = (rawData || []) as ListWithPlacesRow[];
      const total = listsWithPlaces[0]?.total_count ?? 0;
      const typedLists: ListWithPlaces[] = listsWithPlaces.map((list) => ({
        ...list,
        location: list.longitude && list.latitude ? { longitude: list.longitude, latitude: list.latitude } : null,
        places: list.places || [],
      }));
      return { data: typedLists, total };
    },
  });
};

export const useGetViewableLists = (): UseQueryResult<GetViewableListsOutput> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.lists.viewable(profile.id),
    queryFn: async () => {
      interface RawListRow {
        id: string;
        user_id: string;
        title: string;
        category: ListCategory;
        location_name: string;
        location: string | null;
        note: string | null;
        created_at: string;
        updated_at: string;
      }
      interface RawListRowWithOwner extends RawListRow {
        owner: { id: string; full_name: string } | null;
      }
      const { data: rawOwnLists, error: ownError } = await supabase.from("lists").select("*").eq("user_id", profile.id).order("created_at", { ascending: false });
      if (ownError) throw new Error(`Failed to fetch own lists: ${ownError.message}`);
      const { data: rawFriendLists, error: friendError } = await supabase
        .from("lists")
        .select(`*, owner:profiles!lists_user_id_fkey(id, full_name)`)
        .neq("user_id", profile.id)
        .order("created_at", { ascending: false });
      if (friendError) throw new Error(`Failed to fetch friends' lists: ${friendError.message}`);
      const ownLists = (rawOwnLists || []) as RawListRow[];
      const friendLists = (rawFriendLists || []) as RawListRowWithOwner[];
      const transformedOwnLists: ViewableList[] = ownLists.map((list) => ({
        ...list, location: typeof list.location === "string" ? parsePostGISPoint(list.location) : null, places: [], owner_name: "You",
      }));
      const transformedFriendLists: ViewableList[] = friendLists.map((list) => ({
        ...list, location: typeof list.location === "string" ? parsePostGISPoint(list.location) : null, places: [], owner_name: list.owner?.full_name || "Unknown",
      }));
      const allLists = [...transformedOwnLists, ...transformedFriendLists];
      return { data: allLists, total: allLists.length };
    },
  });
};

export const useGetListLocations = (): UseQueryResult<ListLocation[]> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();

  return useQuery({
    queryKey: queryKeys.lists.locations,
    queryFn: async () => {
      interface ListLocationRow {
        id: string;
        title: string;
        category: ListCategory;
        location_name: string;
        longitude: number;
        latitude: number;
        owner_name: string;
      }
      const { data: rawData, error } = await supabase.rpc("get_viewable_list_locations", { p_user_id: profile.id });
      if (error) throw new Error(`Failed to fetch list locations: ${error.message}`);
      const rows = (rawData || []) as ListLocationRow[];
      return rows.map((row) => ({
        id: row.id, title: row.title, category: row.category, location_name: row.location_name,
        location: { longitude: row.longitude, latitude: row.latitude }, owner_name: row.owner_name,
      }));
    },
  });
};

export const useSubscribeToListCreation = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useCallback(
    (onListCreated: () => void) => {
      const channel = supabase
        .channel("my-lists")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "lists", filter: `user_id=eq.${profile.id}` }, () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
          onListCreated();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    },
    [supabase, profile.id, queryClient]
  );
};

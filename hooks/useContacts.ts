import { useMutation, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";

import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import { queryKeys } from "@/lib/queryKeys";
import {
  Contact,
  CreateContactInput,
  UpdateContactInput,
  GetContactsOutput,
} from "@/types/contact";

// --- Mutation hooks ---

export const useCreateContact = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput): Promise<Contact> => {
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: profile.id,
          name: input.name,
          phone: input.phone || null,
          email: input.email || null,
          company: input.company || null,
          note: input.note || null,
          location: input.location
            ? `POINT(${input.location.longitude} ${input.location.latitude})`
            : null,
          location_name: input.location?.name || null,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create contact: ${error.message}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
};

export const useUpdateContact = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateContactInput): Promise<Contact> => {
      const { contact_id, ...updates } = input;

      const updateData: Record<string, string | null> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.phone !== undefined) updateData.phone = updates.phone || null;
      if (updates.email !== undefined) updateData.email = updates.email || null;
      if (updates.company !== undefined)
        updateData.company = updates.company || null;
      if (updates.note !== undefined) updateData.note = updates.note || null;
      if (updates.location !== undefined) {
        updateData.location = `POINT(${updates.location.longitude} ${updates.location.latitude})`;
        updateData.location_name = updates.location.name;
      }

      const { data, error } = await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", contact_id)
        .eq("user_id", profile.id)
        .select()
        .single();

      if (error) throw new Error(`Failed to update contact: ${error.message}`);
      return data;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contacts.detail(input.contact_id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
};

export const useDeleteContact = () => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactId)
        .eq("user_id", profile.id);

      if (error) throw new Error(`Failed to delete contact: ${error.message}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
};

// --- Query hooks ---

export const useGetContacts = (userId?: string): UseQueryResult<GetContactsOutput> => {
  const { supabase } = useSupabase();
  const profile = useRequireProfile();
  const targetUserId = userId ?? profile.id;

  return useQuery({
    queryKey: queryKeys.contacts.list(targetUserId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_contacts_ordered", {
        p_user_id: targetUserId,
      });
      if (error) throw new Error(`Failed to fetch contacts: ${error.message}`);
      return {
        data: (data as Contact[]) || [],
        total: data?.length || 0,
      };
    },
  });
};

export const useGetContact = (contactId?: string): UseQueryResult<Contact | null> => {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: queryKeys.contacts.detail(contactId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId!)
        .maybeSingle();
      if (error) throw new Error(`Failed to fetch contact: ${error.message}`);
      return data;
    },
    enabled: !!contactId,
  });
};

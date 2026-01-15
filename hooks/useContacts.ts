import { useSupabase } from "./useSupabase";
import { useRequireProfile } from "./useRequireProfile";
import {
  Contact,
  CreateContactInput,
  UpdateContactInput,
  GetContactsOutput,
} from "@/types/contact";

export const useContacts = () => {
  const { isLoaded, supabase } = useSupabase();
  const profile = useRequireProfile();

  // ––– QUERIES –––

  /**
   * Get contacts for a specific user (self or friend)
   */
  const getContacts = async (
    userId?: string
  ): Promise<GetContactsOutput> => {
    const targetUserId = userId ?? profile.id;

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", targetUserId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }

    return {
      data: data || [],
      total: data?.length || 0,
    };
  };

  /**
   * Get a single contact by ID
   */
  const getContact = async (
    contactId: string
  ): Promise<Contact | null> => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch contact: ${error.message}`);
    }

    return data;
  };

  // ––– MUTATIONS –––

  /**
   * Create a new contact
   */
  const createContact = async (
    input: CreateContactInput
  ): Promise<Contact> => {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        user_id: profile.id,
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        company: input.company || null,
        note: input.note || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contact: ${error.message}`);
    }

    return data;
  };

  /**
   * Update an existing contact
   */
  const updateContact = async (
    input: UpdateContactInput
  ): Promise<Contact> => {
    const { contact_id, ...updates } = input;

    const updateData: Record<string, string | null> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.email !== undefined) updateData.email = updates.email || null;
    if (updates.company !== undefined)
      updateData.company = updates.company || null;
    if (updates.note !== undefined) updateData.note = updates.note || null;

    const { data, error } = await supabase
      .from("contacts")
      .update(updateData)
      .eq("id", contact_id)
      .eq("user_id", profile.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contact: ${error.message}`);
    }

    return data;
  };

  /**
   * Delete a contact
   */
  const deleteContact = async (contactId: string): Promise<void> => {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contactId)
      .eq("user_id", profile.id);

    if (error) {
      throw new Error(`Failed to delete contact: ${error.message}`);
    }
  };

  return {
    isLoaded,
    // Queries
    getContacts,
    getContact,
    // Mutations
    createContact,
    updateContact,
    deleteContact,
  };
};

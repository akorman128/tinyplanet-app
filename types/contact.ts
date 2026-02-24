// Core interface matching database schema
export interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  note: string | null;
  location: string | null;
  location_name: string | null;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

// Contact picker return type (from device)
export interface PickedContact {
  name: string;
  phones: string[];
  emails: string[];
  company: string | null;
  note: string | null;
}

// Input DTOs
export interface CreateContactInput {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  note?: string;
  location?: { latitude: number; longitude: number; name: string };
}

export interface UpdateContactInput {
  contact_id: string;
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  note?: string;
  location?: { latitude: number; longitude: number; name: string };
}

// Output DTOs
export interface GetContactsOutput {
  data: Contact[];
  total: number;
}

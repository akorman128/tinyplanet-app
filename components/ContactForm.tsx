import { Controller, Control, FieldErrors } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/design-system";
import { LocationSearchInput } from "./LocationSearchInput";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  phone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().email().safeParse(val).success,
      { message: "Invalid email address" }
    ),
  company: z.string().trim().optional(),
  note: z.string().trim().optional(),
  location: z
    .object({
      name: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })
    .nullable()
    .optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  control: Control<ContactFormData>;
  errors: FieldErrors<ContactFormData>;
}

export function ContactForm({ control, errors }: ContactFormProps) {
  return (
    <>
      {/* Name */}
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Name*"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Contact name"
            autoCapitalize="words"
            error={errors.name?.message}
          />
        )}
      />

      {/* Phone */}
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Phone"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            error={errors.phone?.message}
          />
        )}
      />

      {/* Email */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
          />
        )}
      />

      {/* Company */}
      <Controller
        control={control}
        name="company"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Company"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Company or organization"
            autoCapitalize="words"
            error={errors.company?.message}
          />
        )}
      />

      {/* Note */}
      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Note"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Additional notes"
            multiline
            numberOfLines={4}
            error={errors.note?.message}
          />
        )}
      />

      {/* Location */}
      <Controller
        control={control}
        name="location"
        render={({ field: { onChange, value } }) => (
          <LocationSearchInput
            label="Location"
            value={value}
            onChange={onChange}
            placeholder="Search for a place..."
          />
        )}
      />
    </>
  );
}

import { useState } from "react";
import { View, Alert, Pressable } from "react-native";
import { useRouter, Stack } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Button, Icons, colors } from "@/design-system";
import { useContactPicker } from "@/hooks/useContactPicker";
import { useContacts } from "@/hooks/useContacts";

const addContactSchema = z.object({
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
});

type AddContactForm = z.infer<typeof addContactSchema>;

export default function AddContactScreen() {
  const router = useRouter();
  const { pickFullContact } = useContactPicker();
  const { createContact } = useContacts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<AddContactForm>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      company: "",
      note: "",
    },
    mode: "all",
  });

  const handleImportFromPhone = async () => {
    const contact = await pickFullContact();
    if (contact) {
      setValue("name", contact.name, { shouldValidate: true });
      setValue("phone", contact.phones[0] || "", { shouldValidate: true });
      setValue("email", contact.emails[0] || "", { shouldValidate: true });
      setValue("company", contact.company || "", { shouldValidate: true });
      setValue("note", contact.note || "", { shouldValidate: true });
    }
  };

  const onSubmit = async (data: AddContactForm) => {
    setIsSubmitting(true);
    try {
      await createContact({
        name: data.name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        company: data.company || undefined,
        note: data.note || undefined,
      });

      Alert.alert("Success", "Contact added successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to add contact"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add Contact",
          headerRight: () => (
            <Pressable onPress={handleImportFromPhone}>
              <Icons.userList size={24} color={colors.hex.purple600} />
            </Pressable>
          ),
        }}
      />
      <View className="flex-1 bg-white">

        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6 pb-12"
          enableOnAndroid={true}
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        >
          {/* Import Button
          <Button size="sm" onPress={handleImportFromPhone} className="mb-6">
            Add Contact
          </Button> */}

          <View className="gap-5">
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

            {/* Save Button */}
            <View className="mt-3">
              <Button
                variant="primary"
                size="md"
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Contact"}
              </Button>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </>
  );
}

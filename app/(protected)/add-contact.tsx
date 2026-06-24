import { useState } from "react";
import { View, Alert, Pressable, Platform } from "react-native";
import { useRouter, Stack } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Icons, colors } from "@/design-system";
import { useContactPicker } from "@/hooks/useContactPicker";
import { useCreateContact } from "@/hooks/useContacts";
import {
  ContactForm,
  contactSchema,
  ContactFormData,
} from "@/components/ContactForm";

export default function AddContactScreen() {
  const router = useRouter();
  const { pickFullContact } = useContactPicker();
  const createContact = useCreateContact();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      company: "",
      note: "",
      location: null,
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

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      await createContact.mutateAsync({
        name: data.name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        company: data.company || undefined,
        note: data.note || undefined,
        location: data.location ?? undefined,
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
          headerRight:
            Platform.OS === "android"
              ? () => (
                  <Pressable onPress={handleImportFromPhone}>
                    <Icons.download4 size={24} color={colors.black} />
                  </Pressable>
                )
              : undefined,
        }}
      />
      {Platform.OS === "ios" && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="square.and.arrow.down"
            onPress={handleImportFromPhone}
          />
        </Stack.Toolbar>
      )}
      <View className="flex-1 bg-cream">
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6 pb-12"
          enableOnAndroid={true}
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-5">
            <ContactForm control={control} errors={errors} />

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

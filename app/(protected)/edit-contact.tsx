import { useEffect } from "react";
import { View, Alert } from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, LoadingState, ErrorState } from "@/design-system";
import {
  ContactForm,
  contactSchema,
  ContactFormData,
} from "@/components/ContactForm";
import { useGetContacts, useUpdateContact } from "@/hooks/useContacts";

export default function EditContactScreen() {
  const router = useRouter();
  const { contactId } = useLocalSearchParams<{ contactId: string }>();
  const updateContact = useUpdateContact();

  // The single-contact query returns raw PostGIS without lat/lng; the list RPC
  // exposes them (via ST_X/ST_Y), which we need to prefill the location field.
  const {
    data: contactsResult,
    isPending: loading,
    error: queryError,
  } = useGetContacts();
  const contact = contactsResult?.data.find((c) => c.id === contactId) ?? null;

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isValid },
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

  // Pre-fill the form once the contact loads
  useEffect(() => {
    if (!contact) return;

    reset({
      name: contact.name,
      phone: contact.phone ?? "",
      email: contact.email ?? "",
      company: contact.company ?? "",
      note: contact.note ?? "",
      location:
        contact.latitude != null && contact.longitude != null
          ? {
              name: contact.location_name ?? "",
              latitude: contact.latitude,
              longitude: contact.longitude,
            }
          : null,
    });
    trigger();
  }, [contact, reset, trigger]);

  const onSubmit = async (data: ContactFormData) => {
    if (!contactId) return;

    try {
      await updateContact.mutateAsync({
        contact_id: contactId,
        name: data.name,
        phone: data.phone ?? "",
        email: data.email ?? "",
        company: data.company ?? "",
        note: data.note ?? "",
        location: data.location ?? null,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update contact"
      );
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Contact" }} />
        <View className="flex-1 bg-cream">
          <LoadingState />
        </View>
      </>
    );
  }

  if (queryError || !contact) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Contact" }} />
        <View className="flex-1 bg-cream">
          <ErrorState message={queryError?.message ?? "Contact not found"} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Edit Contact" }} />
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
                disabled={!isValid || updateContact.isPending}
              >
                {updateContact.isPending ? "Saving..." : "Save Contact"}
              </Button>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </>
  );
}

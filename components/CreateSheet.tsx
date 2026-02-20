import React, { forwardRef, useState, useEffect } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Icons,
  TabBar,
  OptionSelector,
  colors,
  LoadingState,
} from "@/design-system";
import { usePosts } from "@/hooks/usePosts";
import { useTravelPlan } from "@/hooks/useTravelPlan";
import { PostVisibility, AttachedList } from "@/types/post";
import { TravelPlan, CreateTravelPlanInput } from "@/types/travelPlan";
import { PostForm, postSchema, PostFormData } from "./PostForm";
import {
  travelPlanSchema,
  TravelPlanFormData,
  TravelPlanForm,
} from "./TravelPlanForm";
import { ActiveTravelPlanBanner } from "@/design-system";

// Content type
type ContentType = "post" | "travel-plan";

interface CreateSheetProps {
  initialType: ContentType;
  onSheetChange: (index: number) => void;
  selectedList: AttachedList | null;
  onOpenListPicker: () => void;
  onRemoveList: () => void;
}

export const CreateSheet = forwardRef<BottomSheet, CreateSheetProps>(
  (
    { initialType = "post", onSheetChange, selectedList, onOpenListPicker, onRemoveList },
    ref
  ) => {
    const router = useRouter();
    const { createPost } = usePosts();
    const { createTravelPlan, getActiveTravelPlan, cancelTravelPlan } =
      useTravelPlan();
    const [contentType, setContentType] = useState<ContentType>(initialType);
    const [visibility, setVisibility] = useState<PostVisibility>("public");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTravelPlan, setActiveTravelPlan] = useState<TravelPlan | null>(
      null
    );
    const [loading, setLoading] = useState(false);

    // Post form
    const postForm = useForm<PostFormData>({
      resolver: zodResolver(postSchema),
      defaultValues: { text: "" },
      mode: "onChange",
    });

    // Travel plan form
    const travelPlanForm = useForm<TravelPlanFormData>({
      resolver: zodResolver(travelPlanSchema),
      defaultValues: {
        destination: null,
        startDate: new Date(),
        durationDays: 7,
      },
      mode: "all",
    });

    // Fetch active travel plan when sheet opens on travel-plan tab
    useEffect(() => {
      const fetchActivePlan = async () => {
        if (contentType === "travel-plan") {
          try {
            setLoading(true);
            const { data } = await getActiveTravelPlan();
            setActiveTravelPlan(data);
          } catch (error) {
            console.error("Error fetching active travel plan:", error);
          } finally {
            setLoading(false);
          }
        }
      };

      fetchActivePlan();
    }, [contentType, getActiveTravelPlan]);

    // Unified reset logic
    const resetForms = (type?: ContentType) => {
      postForm.reset();
      travelPlanForm.reset();
      setVisibility(type === "post" ? "public" : "friends");
      onRemoveList();
    };

    // Reset forms when switching tabs
    const handleTabChange = (newType: ContentType) => {
      setContentType(newType);
      resetForms(newType);
    };

    const visibilityOptions: {
      value: PostVisibility;
      label: string;
      icon?: any;
    }[] = [
      { value: "public", label: "Public", icon: Icons.globe },
      { value: "friends", label: "Friends", icon: Icons.unlocked },
    ];

    // Handle editing the active travel plan - navigate to edit screen
    const handleEditActivePlan = () => {
      if (!activeTravelPlan) return;

      // Close the sheet
      (ref as React.RefObject<BottomSheet>).current?.close();

      setContentType("post");
      // Navigate to edit screen using the post_id
      router.push({
        pathname: "/edit-travel-plan",
        params: { postId: activeTravelPlan.post_id },
      });
    };

    // Handle deleting the active travel plan
    const handleDeleteActivePlan = () => {
      if (!activeTravelPlan) return;

      Alert.alert(
        "Cancel Travel Plan",
        "Are you sure you want to cancel this travel plan? This will also delete the associated post.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await cancelTravelPlan(activeTravelPlan.id);
                Alert.alert("Success", "Travel plan cancelled");
                setActiveTravelPlan(null);
                (ref as React.RefObject<BottomSheet>).current?.close();
                setContentType("post");
              } catch (error) {
                Alert.alert("Error", "Failed to cancel travel plan");
              }
            },
          },
        ]
      );
    };

    const resetAndClose = () => {
      resetForms(contentType);
      (ref as React.RefObject<BottomSheet>).current?.snapToIndex(-1);
      (ref as React.RefObject<BottomSheet>).current?.close();
    };

    const submitPost = async (data: PostFormData) => {
      await createPost({
        text: data.text,
        visibility,
        list_id: selectedList?.id || null,
      });
    };

    const submitTravelPlan = async (data: TravelPlanFormData) => {
      if (!data.destination) {
        console.error("Destination is required");
        return;
      }

      const travelPlanInput: CreateTravelPlanInput = {
        destination: {
          name: data.destination.name,
          latitude: data.destination.latitude,
          longitude: data.destination.longitude,
        },
        start_date: data.startDate.toISOString().split("T")[0],
        duration_days: data.durationDays,
        post_visibility: visibility as PostVisibility,
      };

      await createTravelPlan(travelPlanInput);
    };

    const onSubmit = async (data: any) => {
      setIsSubmitting(true);
      try {
        if (contentType === "post") {
          await submitPost(data);
        } else {
          await submitTravelPlan(data);
        }

        // Reset and close
        resetAndClose();
      } catch (err) {
        Alert.alert(
          "Error",
          `Failed to create ${contentType === "post" ? "post" : "travel plan"}`
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    const getButtonText = () => {
      if (isSubmitting) {
        return contentType === "post" ? "Posting..." : "Creating...";
      }
      return contentType === "post" ? "Post" : "Create Plan";
    };

    const handleSheetChange = (index: number) => {
      // Reset travel plan state when sheet closes
      if (index < 0) {
        setActiveTravelPlan(null);
      }
      // Forward to parent handler
      onSheetChange?.(index);
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={["75%"]}
        enablePanDownToClose
        onChange={handleSheetChange}
        backgroundStyle={{
          backgroundColor: colors.hex.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.hex.placeholder,
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetScrollView className="flex-1 px-6 pb-6">
          <TabBar
            tabs={[
              { id: "post", label: "Post" },
              { id: "travel-plan", label: "Travel Plan" },
            ]}
            activeTab={contentType}
            onTabChange={(tabId) => handleTabChange(tabId as ContentType)}
            className="mb-4"
          />

          {contentType === "post" && !loading && (
            <PostForm
              control={postForm.control}
              errors={postForm.formState.errors}
              selectedList={selectedList}
              onAttachList={onOpenListPicker}
              onRemoveList={onRemoveList}
            />
          )}

          {contentType === "travel-plan" && (
            <>
              {loading && <LoadingState />}

              {activeTravelPlan && !loading && (
                <ActiveTravelPlanBanner
                  travelPlan={activeTravelPlan}
                  onEdit={handleEditActivePlan}
                  onDelete={handleDeleteActivePlan}
                />
              )}

              {!activeTravelPlan && !loading && (
                <TravelPlanForm
                  control={travelPlanForm.control}
                  errors={travelPlanForm.formState.errors}
                  activeTravelPlan={activeTravelPlan}
                  isEditingActivePlan={false}
                  onCancelEdit={() => {}}
                />
              )}
            </>
          )}

          {(contentType === "post" || !activeTravelPlan) && !loading && (
            <>
              <OptionSelector
                label="Who can see this?"
                options={visibilityOptions}
                value={visibility}
                onChange={setVisibility}
                className="mt-6 mb-6"
              />

              <Button
                variant="primary"
                onPress={
                  contentType === "post"
                    ? postForm.handleSubmit(onSubmit)
                    : travelPlanForm.handleSubmit(onSubmit)
                }
                disabled={
                  isSubmitting ||
                  (contentType === "post"
                    ? !!postForm.formState.errors.text
                    : false)
                }
              >
                {getButtonText()}
              </Button>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

CreateSheet.displayName = "CreateSheet";

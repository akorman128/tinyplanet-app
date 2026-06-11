import { renderHook, waitFor, act } from "@testing-library/react";
import { createMockSupabase, MockSupabaseClient } from "../utils/mock-supabase";
import { createTestWrapper } from "../utils/test-wrapper";

let mockSupabase: MockSupabaseClient;
const mockSetProfileState = vi.fn();
const mockProfileState = {
  id: "user-a",
  full_name: "Test User",
  avatar_url: "https://old-url.jpg",
};

const mockAlert = vi.fn();
const mockUpdateProfileMutateAsync = vi.fn().mockResolvedValue({});

vi.mock("react-native", () => ({
  Alert: { alert: (...args: unknown[]) => mockAlert(...args) },
  Platform: { OS: "ios" },
  ActionSheetIOS: { showActionSheetWithOptions: vi.fn() },
}));

vi.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({
    supabase: mockSupabase,
    isLoaded: true,
    session: { user: { id: "user-a" } },
  }),
}));

vi.mock("@/hooks/useProfile", () => ({
  useUpdateProfile: () => ({
    mutateAsync: mockUpdateProfileMutateAsync,
  }),
}));

vi.mock("@/stores/profileStore", () => ({
  useProfileStore: () => ({
    profileState: mockProfileState,
    setProfileState: mockSetProfileState,
  }),
}));

const mockLaunchImageLibraryAsync = vi.fn();
const mockLaunchCameraAsync = vi.fn();

vi.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: (...args: unknown[]) =>
    mockLaunchImageLibraryAsync(...args),
  launchCameraAsync: (...args: unknown[]) => mockLaunchCameraAsync(...args),
}));

const mockManipulateAsync = vi.fn();

vi.mock("expo-image-manipulator", () => ({
  manipulateAsync: (...args: unknown[]) => mockManipulateAsync(...args),
  SaveFormat: { JPEG: "jpeg" },
}));

const mockFetch = vi.fn();
const originalFetch = global.fetch;

const { useUploadAvatar } = await import("@/hooks/useUploadAvatar");

function setupHappyPath() {
  mockLaunchImageLibraryAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file://picked.jpg" }],
  });
  mockLaunchCameraAsync.mockResolvedValue({
    canceled: false,
    assets: [{ uri: "file://camera.jpg" }],
  });
  mockManipulateAsync.mockResolvedValue({ uri: "file://resized.jpg" });
  mockFetch.mockResolvedValue({
    blob: () =>
      Promise.resolve(new Blob(["image-data"], { type: "image/jpeg" })),
  });
  global.fetch = mockFetch;

  mockSupabase.configureStorage("avatars", {
    upload: { data: { path: "user-a.jpg" }, error: null },
    getPublicUrl: {
      data: { publicUrl: "https://storage.test/avatars/user-a.jpg" },
    },
  });
  mockUpdateProfileMutateAsync.mockResolvedValue({});
}

describe("useUploadAvatar", () => {
  beforeEach(() => {
    mockSupabase = createMockSupabase();
    mockSetProfileState.mockClear();
    mockAlert.mockClear();
    mockUpdateProfileMutateAsync.mockClear();
    mockLaunchImageLibraryAsync.mockReset();
    mockLaunchCameraAsync.mockReset();
    mockManipulateAsync.mockReset();
    mockFetch.mockReset();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("picks from library, resizes, uploads, and updates profile", async () => {
    setupHappyPath();

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUploadAvatar(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("library");
    });

    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        allowsEditing: true,
        aspect: [1, 1],
      })
    );
    expect(mockManipulateAsync).toHaveBeenCalledWith(
      "file://picked.jpg",
      [{ resize: { width: 500, height: 500 } }],
      { compress: 0.7, format: "jpeg" }
    );
    expect(mockSupabase.storage.from).toHaveBeenCalledWith("avatars");
    expect(mockUpdateProfileMutateAsync).toHaveBeenCalledWith({
      updateData: {
        avatar_url: expect.stringContaining(
          "https://storage.test/avatars/user-a.jpg?t="
        ),
      },
    });
  });

  it("picks from camera when source is 'camera'", async () => {
    setupHappyPath();

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUploadAvatar(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("camera");
    });

    expect(mockLaunchCameraAsync).toHaveBeenCalled();
    expect(mockLaunchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it("does not upload when picker is cancelled", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true });
    global.fetch = mockFetch;

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUploadAvatar(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync("library");
      } catch {
        // Expected — mutation throws CANCELLED
      }
    });

    expect(mockManipulateAsync).not.toHaveBeenCalled();
    expect(mockSupabase.storage.from).not.toHaveBeenCalled();
    expect(mockUpdateProfileMutateAsync).not.toHaveBeenCalled();
  });

  it("shows alert on upload error", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://picked.jpg" }],
    });
    mockManipulateAsync.mockResolvedValue({ uri: "file://resized.jpg" });
    mockFetch.mockResolvedValue({
      blob: () => Promise.resolve(new Blob(["data"], { type: "image/jpeg" })),
    });
    global.fetch = mockFetch;

    mockSupabase.configureStorage("avatars", {
      upload: { data: null, error: { message: "Storage quota exceeded" } },
      getPublicUrl: {
        data: { publicUrl: "https://storage.test/avatars/user-a.jpg" },
      },
    });

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUploadAvatar(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync("library");
      } catch {
        // Expected
      }
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "Upload failed",
        expect.any(String)
      );
    });

    expect(mockUpdateProfileMutateAsync).not.toHaveBeenCalled();
  });

  it("shows alert on profile update error", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://picked.jpg" }],
    });
    mockManipulateAsync.mockResolvedValue({ uri: "file://resized.jpg" });
    mockFetch.mockResolvedValue({
      blob: () => Promise.resolve(new Blob(["data"], { type: "image/jpeg" })),
    });
    global.fetch = mockFetch;

    mockSupabase.configureStorage("avatars", {
      upload: { data: { path: "user-a.jpg" }, error: null },
      getPublicUrl: {
        data: { publicUrl: "https://storage.test/avatars/user-a.jpg" },
      },
    });
    mockUpdateProfileMutateAsync.mockRejectedValue(
      new Error("Profile update failed")
    );

    const { Wrapper } = createTestWrapper(mockSupabase);
    const { result } = renderHook(() => useUploadAvatar(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      try {
        await result.current.mutateAsync("library");
      } catch {
        // Expected
      }
    });

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        "Upload failed",
        "Profile update failed"
      );
    });
  });
});

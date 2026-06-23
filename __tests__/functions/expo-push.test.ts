import { describe, it, expect } from "vitest";
import { buildMessage } from "../../supabase/functions/_shared/expo-push";

describe("buildMessage", () => {
  const base = {
    recipients: ["u1"],
    title: "Alice",
    body: "Alice posted",
    data: { type: "post", postId: "p1" },
  };

  it("threads type into data and sets default sound", () => {
    const msg = buildMessage("ExponentPushToken[x]", base);
    expect(msg.to).toBe("ExponentPushToken[x]");
    expect(msg.title).toBe("Alice");
    expect(msg.body).toBe("Alice posted");
    expect(msg.sound).toBe("default");
    expect(msg.data.type).toBe("post");
    expect(msg.data.postId).toBe("p1");
  });

  it("adds avatarUrl to data only when present", () => {
    expect(buildMessage("t", base).data.avatarUrl).toBeUndefined();
    const withAvatar = buildMessage("t", {
      ...base,
      avatarUrl: "https://x/a.jpg",
    });
    expect(withAvatar.data.avatarUrl).toBe("https://x/a.jpg");
  });

  it("includes badge only when set", () => {
    expect(buildMessage("t", base).badge).toBeUndefined();
    expect(buildMessage("t", { ...base, badge: 3 }).badge).toBe(3);
  });
});

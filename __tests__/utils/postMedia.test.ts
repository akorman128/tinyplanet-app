import { postMediaPathsFromUrls } from "../../utils/postMedia";

describe("postMediaPathsFromUrls", () => {
  it("extracts the object path from a public post-media URL", () => {
    const urls = [
      "https://abc.supabase.co/storage/v1/object/public/post-media/u1/p1.jpg",
    ];
    expect(postMediaPathsFromUrls(urls)).toEqual(["u1/p1.jpg"]);
  });

  it("strips query strings", () => {
    const urls = [
      "https://abc.supabase.co/storage/v1/object/public/post-media/u1/p1.jpg?t=9",
    ];
    expect(postMediaPathsFromUrls(urls)).toEqual(["u1/p1.jpg"]);
  });

  it("ignores URLs that are not post-media objects", () => {
    const urls = [
      "https://abc.supabase.co/storage/v1/object/public/avatars/u1.jpg",
      "https://example.com/x.jpg",
    ];
    expect(postMediaPathsFromUrls(urls)).toEqual([]);
  });

  it("handles an empty list", () => {
    expect(postMediaPathsFromUrls([])).toEqual([]);
  });
});

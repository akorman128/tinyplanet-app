const MARKER = "/post-media/";

export function postMediaPathsFromUrls(urls: string[]): string[] {
  const paths: string[] = [];
  for (const url of urls) {
    const idx = url.indexOf(MARKER);
    if (idx === -1) continue;
    const path = url.slice(idx + MARKER.length).split("?")[0];
    if (path) paths.push(path);
  }
  return paths;
}

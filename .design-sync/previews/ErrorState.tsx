import { ErrorState } from "tiny-planet";

export const Default = () => (
  <div style={{ width: 320, height: 160, display: "flex" }}>
    <ErrorState message="Couldn't load this hang. Check your connection and try again." />
  </div>
);

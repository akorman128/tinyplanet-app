import { EmptyState } from "tiny-planet";

export const Default = () => (
  <div style={{ height: 160, width: 300, display: "flex" }}>
    <EmptyState message="No hangs yet — start one and it'll show up here." />
  </div>
);

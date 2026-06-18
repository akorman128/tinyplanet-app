import { InfoRow } from "tiny-planet";

export const Rows = () => (
  <div style={{ width: 320, display: "flex", flexDirection: "column" }}>
    <InfoRow label="When" value="Sat 7:00 PM" />
    <InfoRow label="Where" value="Ritual Coffee, Valencia St" />
    <InfoRow label="Going" value="4 friends" />
  </div>
);

export const Loading = () => (
  <div style={{ width: 320, display: "flex" }}>
    <InfoRow label="Where" loading />
  </div>
);

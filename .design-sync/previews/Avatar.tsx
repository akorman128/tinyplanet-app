import { Avatar } from "tiny-planet";

export const Initials = () => (
  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
    <Avatar fullName="Alex Korman" size="small" />
    <Avatar fullName="Priya Patel" size="medium" />
    <Avatar fullName="Sam Lee" size="large" />
  </div>
);

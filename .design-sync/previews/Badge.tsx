import { Badge } from "tiny-planet";

export const Variants = () => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
    <Badge variant="primary">Going</Badge>
    <Badge variant="secondary">Maybe</Badge>
    <Badge variant="coral">Hang</Badge>
    <Badge variant="warning">Pending</Badge>
    <Badge variant="error">Cancelled</Badge>
    <Badge variant="default">Draft</Badge>
  </div>
);

export const Sizes = () => (
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <Badge variant="primary" size="small">Small</Badge>
    <Badge variant="primary" size="medium">Medium</Badge>
  </div>
);

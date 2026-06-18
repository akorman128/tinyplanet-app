import { Button } from "tiny-planet";

export const Primary = () => <Button variant="primary">Get started</Button>;

export const Coral = () => <Button variant="coral">Join the hang</Button>;

export const Secondary = () => <Button variant="secondary">Maybe later</Button>;

export const Sizes = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <Button variant="primary" size="sm">Small</Button>
    <Button variant="primary" size="md">Medium</Button>
    <Button variant="primary" size="lg">Large</Button>
  </div>
);

export const Disabled = () => <Button variant="primary" disabled>Unavailable</Button>;

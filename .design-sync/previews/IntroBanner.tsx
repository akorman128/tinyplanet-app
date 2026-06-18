import { IntroBanner } from "tiny-planet";

export const Default = () => (
  <div style={{ width: 320, display: "flex" }}>
    <IntroBanner
      introducerName="Jordan Lee"
      introducerAvatarUrl={null}
      message="You two are both into climbing and always in the Mission — figured you'd hit it off!"
    />
  </div>
);

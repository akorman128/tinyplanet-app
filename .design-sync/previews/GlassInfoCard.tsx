import { GlassInfoCard, GlassInfoItem } from "tiny-planet";

export const HangDetails = () => (
  <div style={{ width: 340, background: "#ffffff", borderRadius: 12 }}>
    <GlassInfoCard>
      <GlassInfoItem label="Where" value="Dolores Park, San Francisco" />
      <GlassInfoItem label="When" value="Saturday, 2:00 PM" />
      <GlassInfoItem label="Hosted by" value="Alex Korman" />
    </GlassInfoCard>
  </div>
);

export const WithStates = () => (
  <div style={{ width: 340, background: "#ffffff", borderRadius: 12 }}>
    <GlassInfoCard>
      <GlassInfoItem label="Trip" value="Tokyo, Japan" />
      <GlassInfoItem label="Dates" value="Mar 12 – Mar 20" />
      <GlassInfoItem label="Travelers" loading />
      <GlassInfoItem label="Notes" />
    </GlassInfoCard>
  </div>
);

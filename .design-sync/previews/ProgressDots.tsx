import { ProgressDots } from "tiny-planet";

// ProgressDots renders over the dark onboarding background, so the cards use a
// dark wrapper — its upcoming dots are intentionally faint and only read on dark.
const Stage = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: "#1b1733",
      padding: "22px 28px",
      borderRadius: 16,
      width: 260,
      display: "flex",
      justifyContent: "center",
    }}
  >
    {children}
  </div>
);

export const Start = () => (
  <Stage>
    <ProgressDots count={5} activeIndex={0} />
  </Stage>
);

export const Midway = () => (
  <Stage>
    <ProgressDots count={5} activeIndex={2} />
  </Stage>
);

export const Last = () => (
  <Stage>
    <ProgressDots count={5} activeIndex={4} />
  </Stage>
);

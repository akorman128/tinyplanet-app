import * as React from "react";
import { Slider } from "tiny-planet";

// The Slider measures its track width into a ref on layout, which does NOT
// trigger a re-render — so on a static first paint the thumb/filled-track pin
// at the minimum. Force one re-render shortly after mount (once layout has run)
// so the thumb reflects `value`.
function useSettled() {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => force((n) => n + 1), 150);
    return () => clearTimeout(t);
  }, []);
}

export const Distance = () => {
  useSettled();
  return (
    <div style={{ width: 340 }}>
      <Slider
        label="Search radius"
        value={3}
        min={1}
        max={25}
        step={1}
        onValueChange={() => {}}
        formatValue={(v) => `${v} mi`}
      />
    </div>
  );
};

export const GroupSize = () => {
  useSettled();
  return (
    <div style={{ width: 340 }}>
      <Slider
        label="Max group size"
        value={6}
        min={2}
        max={12}
        step={1}
        onValueChange={() => {}}
        formatValue={(v) => `${v} people`}
      />
    </div>
  );
};

export const Full = () => {
  useSettled();
  return (
    <div style={{ width: 340 }}>
      <Slider
        label="Plan ahead"
        value={14}
        min={0}
        max={14}
        step={1}
        onValueChange={() => {}}
        formatValue={(v) => `${v} days`}
      />
    </div>
  );
};

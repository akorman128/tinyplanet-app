import { Select } from "tiny-planet";

const VIBE_OPTIONS = [
  { value: "coffee", label: "Coffee & catch up" },
  { value: "hike", label: "Outdoor hike" },
  { value: "dinner", label: "Dinner out" },
  { value: "study", label: "Study session" },
];

export const Selected = () => (
  <div style={{ width: 320 }}>
    <Select
      label="Hang type"
      value="coffee"
      onChange={() => {}}
      options={VIBE_OPTIONS}
    />
  </div>
);

export const Placeholder = () => (
  <div style={{ width: 320 }}>
    <Select
      label="Add to list"
      value=""
      onChange={() => {}}
      placeholder="Choose a saved list"
      options={[
        { value: "favorites", label: "Favorite spots" },
        { value: "coffee", label: "Coffee shops" },
        { value: "tokyo", label: "Tokyo trip 2026" },
      ]}
    />
  </div>
);

export const WithError = () => (
  <div style={{ width: 320 }}>
    <Select
      label="Hang type"
      value=""
      onChange={() => {}}
      placeholder="Choose a vibe"
      error="Pick a hang type to continue."
      options={VIBE_OPTIONS}
    />
  </div>
);

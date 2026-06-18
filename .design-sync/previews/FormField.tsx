import { FormField } from "tiny-planet";

// FormField wraps a control that has no built-in label/error (date pickers,
// segmented selectors, custom fields). The control below is illustrative of
// what an author supplies as children; FormField provides the label + error.
const Control = ({
  children,
  invalid,
}: {
  children: React.ReactNode;
  invalid?: boolean;
}) => (
  <div
    style={{
      padding: "14px 16px",
      borderRadius: 12,
      background: "#fff",
      border: invalid ? "1px solid #ef4444" : "1px solid #d1d5db",
      fontSize: 16,
      color: "#111827",
    }}
  >
    {children}
  </div>
);

export const WhenField = () => (
  <div style={{ width: 320 }}>
    <FormField label="🕒 When">
      <Control>Sat, Jun 21 · 7:00 PM</Control>
    </FormField>
  </div>
);

export const WithError = () => (
  <div style={{ width: 320 }}>
    <FormField label="📍 Where" error="Location is required">
      <Control invalid>Search for a place…</Control>
    </FormField>
  </div>
);

export const StartDate = () => (
  <div style={{ width: 320 }}>
    <FormField label="Start date">
      <Control>Jun 21, 2026</Control>
    </FormField>
  </div>
);

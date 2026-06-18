import { OptionSelector, Icons } from "tiny-planet";

export const Default = () => (
  <div style={{ width: 360 }}>
    <OptionSelector
      label="Who can see this hang?"
      value="friends"
      onChange={() => {}}
      options={[
        { value: "friends", label: "Friends" },
        { value: "mutuals", label: "Mutuals" },
        { value: "public", label: "Public" },
      ]}
    />
  </div>
);

export const WithIcons = () => (
  <div style={{ width: 360 }}>
    <OptionSelector
      label="Vibe"
      value="chill"
      onChange={() => {}}
      options={[
        { value: "chill", label: "Chill", icon: Icons.heartOutline },
        { value: "active", label: "Active", icon: Icons.star },
        { value: "foodie", label: "Foodie", icon: Icons.pin },
      ]}
    />
  </div>
);

import { ButtonGroup, Icons } from "tiny-planet";

export const Default = () => (
  <div style={{ width: 320 }}>
    <ButtonGroup
      activeIndex={0}
      options={[
        { label: "Hangs", onPress: () => {} },
        { label: "Travel", onPress: () => {} },
      ]}
    />
  </div>
);

export const WithIcons = () => (
  <div style={{ width: 320 }}>
    <ButtonGroup
      activeIndex={1}
      options={[
        { label: "List", icon: Icons.list, onPress: () => {} },
        { label: "Map", icon: Icons.globe, onPress: () => {} },
      ]}
    />
  </div>
);

export const WithBadge = () => (
  <div style={{ width: 360 }}>
    <ButtonGroup
      activeIndex={0}
      options={[
        { label: "Friends", onPress: () => {}, badge: 3 },
        { label: "Requests", onPress: () => {}, badge: true },
        { label: "Saved", onPress: () => {} },
      ]}
    />
  </div>
);

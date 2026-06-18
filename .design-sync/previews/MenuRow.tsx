import { MenuRow, Icons } from "tiny-planet";

export const SettingsGroup = () => (
  <div style={{ width: 340, background: "#ffffff", borderRadius: 12 }}>
    <MenuRow
      icon={<Icons.edit size={20} color="#111827" />}
      label="Edit profile"
      onPress={() => {}}
      position="first"
    />
    <MenuRow
      icon={<Icons.notification size={20} color="#111827" />}
      label="Notifications"
      onPress={() => {}}
      position="middle"
    />
    <MenuRow
      icon={<Icons.lock size={20} color="#111827" />}
      label="Privacy"
      onPress={() => {}}
      position="middle"
    />
    <MenuRow
      icon={<Icons.settings size={20} color="#111827" />}
      label="Account settings"
      onPress={() => {}}
      position="last"
    />
  </div>
);

export const Standalone = () => (
  <div style={{ width: 340, background: "#ffffff", borderRadius: 12 }}>
    <MenuRow
      icon={<Icons.shieldCheck size={20} color="#111827" />}
      label="Blocked accounts"
      onPress={() => {}}
      position="standalone"
    />
  </div>
);

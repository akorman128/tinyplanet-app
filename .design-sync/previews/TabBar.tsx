import { TabBar } from "tiny-planet";

export const Default = () => (
  <div style={{ width: 340 }}>
    <TabBar
      tabs={[
        { id: "feed", label: "Feed" },
        { id: "map", label: "Map" },
        { id: "messages", label: "Messages" },
      ]}
      activeTab="feed"
      onTabChange={() => {}}
    />
  </div>
);

export const ProfileTabs = () => (
  <div style={{ width: 340 }}>
    <TabBar
      tabs={[
        { id: "hangs", label: "Hangs" },
        { id: "places", label: "Places" },
        { id: "friends", label: "Friends" },
      ]}
      activeTab="places"
      onTabChange={() => {}}
    />
  </div>
);

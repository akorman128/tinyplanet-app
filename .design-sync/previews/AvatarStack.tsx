import { AvatarStack } from "tiny-planet";

const friends = [
  { id: "1", full_name: "Alex Korman" },
  { id: "2", full_name: "Priya Patel" },
  { id: "3", full_name: "Sam Lee" },
  { id: "4", full_name: "Jordan Diaz" },
  { id: "5", full_name: "Maya Chen" },
];

export const SmallGroup = () => (
  <AvatarStack people={friends.slice(0, 3)} size="small" />
);

export const WithOverflow = () => (
  <AvatarStack people={friends} max={3} size="medium" total={12} />
);

export const Sizes = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <AvatarStack people={friends.slice(0, 4)} max={3} size="small" total={9} />
    <AvatarStack people={friends.slice(0, 4)} max={3} size="medium" total={9} />
    <AvatarStack people={friends.slice(0, 4)} max={3} size="large" total={9} />
  </div>
);

import { Input } from "tiny-planet";

export const Labeled = () => (
  <div style={{ width: 300 }}>
    <Input label="Display name" defaultValue="Alex Korman" />
  </div>
);

export const Placeholder = () => (
  <div style={{ width: 300 }}>
    <Input label="Where to?" placeholder="Search a place…" />
  </div>
);

export const WithError = () => (
  <div style={{ width: 300 }}>
    <Input
      label="Username"
      defaultValue="taken_name"
      error="That username is already in use."
    />
  </div>
);

export const CharacterCount = () => (
  <div style={{ width: 300 }}>
    <Input
      label="Bio"
      defaultValue="Exploring tiny planets, one hang at a time."
      showCharacterCount
      maxLength={80}
    />
  </div>
);

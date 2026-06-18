import { CommentInput } from "tiny-planet";

export const Empty = () => (
  <div style={{ width: 360 }}>
    <CommentInput
      value=""
      onChangeText={() => {}}
      onSubmit={() => {}}
      placeholder="Reply to the hang..."
    />
  </div>
);

export const Filled = () => (
  <div style={{ width: 360 }}>
    <CommentInput
      value="Count me in for coffee at Ritual on Saturday!"
      onChangeText={() => {}}
      onSubmit={() => {}}
    />
  </div>
);

export const Submitting = () => (
  <div style={{ width: 360 }}>
    <CommentInput
      value="On my way, running 5 min late"
      onChangeText={() => {}}
      onSubmit={() => {}}
      isSubmitting
    />
  </div>
);

export const WithError = () => (
  <div style={{ width: 360 }}>
    <CommentInput
      value=""
      onChangeText={() => {}}
      onSubmit={() => {}}
      placeholder="Add comment..."
      error="Comment can't be empty."
    />
  </div>
);

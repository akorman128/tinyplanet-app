import * as React from "react";
import Svg, { Path, G, Defs, ClipPath, Rect } from "react-native-svg";
import { IconProps } from "./types";

export const warning = (props: IconProps) => (
  <Svg width="16" height="17" viewBox="0 0 16 17" fill="none" {...props}>
    <Path
      d="M6.78935 3.66546L1.96712 12.0175C1.42935 12.949 2.10135 14.1144 3.17779 14.1144H12.8222C13.8987 14.1144 14.5707 12.9499 14.0329 12.0175L9.21068 3.66546C8.6729 2.73391 7.32712 2.73391 6.78935 3.66546Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 6.33594V9.44705"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.99997 12.6196C7.50931 12.6196 7.11108 12.2205 7.11108 11.7307C7.11108 11.2409 7.50931 10.8418 7.99997 10.8418C8.49064 10.8418 8.88886 11.2409 8.88886 11.7307C8.88886 12.2205 8.49064 12.6196 7.99997 12.6196Z"
      fill="currentColor"
    />
  </Svg>
);

export const video = (props: IconProps) => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none" {...props}>
    <Path
      d="M18.2734 12.0531L24.1799 9.42733C24.6948 9.19866 25.2734 9.5751 25.2734 10.1382V17.8553C25.2734 18.4184 24.6948 18.7949 24.1799 18.5662L18.2734 15.9404"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.171 7.39062H5.83767C4.11945 7.39062 2.72656 8.78352 2.72656 10.5017V17.5017C2.72656 19.22 4.11945 20.6128 5.83767 20.6128H15.171C16.8892 20.6128 18.2821 19.22 18.2821 17.5017V10.5017C18.2821 8.78352 16.8892 7.39062 15.171 7.39062Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const videoCall = (props: IconProps) => (
  <Svg width="33" height="33" fill="none" viewBox="0 0 33 33" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m21.262 14.23 6.75-3.001a.89.89 0 0 1 1.25.813v8.819a.89.89 0 0 1-1.25.813l-6.75-3.001"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M17.718 8.894H7.052a3.556 3.556 0 0 0-3.556 3.555v8a3.556 3.556 0 0 0 3.556 3.556h10.666a3.556 3.556 0 0 0 3.556-3.556v-8a3.556 3.556 0 0 0-3.556-3.555"
    ></Path>
  </Svg>
);

export const videoCallRegular = (props: IconProps) => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <Path
      d="M10.4443 6.88888L13.8194 5.38844C14.1137 5.25777 14.4443 5.47288 14.4443 5.79466V10.2044C14.4443 10.5262 14.1137 10.7413 13.8194 10.6107L10.4443 9.11022"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.66678 4.22217H3.33344C2.3516 4.22217 1.55566 5.01811 1.55566 5.99995V9.99995C1.55566 10.9818 2.3516 11.7777 3.33344 11.7777H8.66678C9.64862 11.7777 10.4446 10.9818 10.4446 9.99995V5.99995C10.4446 5.01811 9.64862 4.22217 8.66678 4.22217Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const youtube = (props: IconProps) => (
  <Svg
    fill="currentColor"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    {...props}
  >
    <Path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />
  </Svg>
);

export const volume = (props: IconProps) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none" {...props}>
    <G clipPath="url(#clip0_6926_58621)">
      <Path
        d="M7.16667 7.66677H3.5C2.396 7.66677 1.5 8.56277 1.5 9.66677V14.3334C1.5 15.4374 2.396 16.3334 3.5 16.3334H7.16667L14.4733 21.0108C14.9173 21.2948 15.5 20.9761 15.5 20.4494V3.5521C15.5 3.02544 14.9173 2.70677 14.4733 2.99077L7.16667 7.66677Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.0518 10.1147C20.0931 11.1561 20.0931 12.8441 19.0518 13.8854"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21.6455 7.52124C24.1188 9.99457 24.1188 14.0052 21.6455 16.4786"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_6926_58621">
        <Rect width="24" height="24" fill="white" transform="translate(0.5)" />
      </ClipPath>
    </Defs>
  </Svg>
);

export const wave = (props: IconProps) => (
  <Svg width="50" height="30" viewBox="0 0 50 30" fill="none" {...props}>
    <Rect y="10" width="2" height="5" fill="currentColor" />
    <Rect x="4" y="5" width="2" height="10" fill="currentColor" />
    <Rect x="8" width="2" height="15" fill="currentColor" />
    <Rect x="12" y="2" width="2" height="13" fill="currentColor" />
    <Rect x="16" y="8" width="2" height="7" fill="currentColor" />
    <Rect x="20" y="6" width="2" height="9" fill="currentColor" />
    <Rect x="24" y="7" width="2" height="8" fill="currentColor" />
    <Rect x="28" width="2" height="15" fill="currentColor" />
    <Rect x="32" y="9" width="2" height="6" fill="currentColor" />
    <Rect x="36" y="7" width="2" height="8" fill="currentColor" />
    <Rect x="40" y="13" width="2" height="2" fill="currentColor" />
    <Rect x="44" y="12" width="2" height="3" fill="currentColor" />
    <Rect x="48" y="13" width="2" height="2" fill="currentColor" />
    <Rect y="15" width="2" height="5" fill="currentColor" />
    <Rect x="4" y="15" width="2" height="10" fill="currentColor" />
    <Rect x="8" y="15" width="2" height="15" fill="currentColor" />
    <Rect x="12" y="15" width="2" height="13" fill="currentColor" />
    <Rect x="16" y="15" width="2" height="7" fill="currentColor" />
    <Rect x="20" y="15" width="2" height="9" fill="currentColor" />
    <Rect x="24" y="15" width="2" height="8" fill="currentColor" />
    <Rect x="28" y="15" width="2" height="15" fill="currentColor" />
    <Rect x="32" y="15" width="2" height="6" fill="currentColor" />
    <Rect x="36" y="15" width="2" height="8" fill="currentColor" />
    <Rect x="40" y="15" width="2" height="2" fill="currentColor" />
    <Rect x="44" y="15" width="2" height="3" fill="currentColor" />
    <Rect x="48" y="15" width="2" height="2" fill="currentColor" />
  </Svg>
);

export const videoOff = (props: IconProps) => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none" {...props}>
    <Path
      d="M18.2773 15.9424L24.1838 18.5682C24.6987 18.7968 25.2773 18.4204 25.2773 17.8573V10.1402C25.2773 9.57706 24.6987 9.20061 24.1838 9.42928L22.7072 10.0857L21.9689 10.4139"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.83279 20.6109C6.72003 20.6109 5.60868 20.6049 5.49902 20.5932C3.93775 20.4267 2.72168 19.1052 2.72168 17.4998V10.4998C2.72168 8.78156 4.11457 7.38867 5.83279 7.38867H15.1661C16.4907 7.38867 17.6219 8.21642 18.0707 9.38285M12.8328 20.6109H15.1661C16.8843 20.6109 18.2772 19.218 18.2772 17.4998V15.7498"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1.42749 26.4502L25.9597 1.96084"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

import * as React from "react";
import Svg, {
  Path,
  G,
  Defs,
  ClipPath,
  Rect,
  Circle,
  Line,
} from "react-native-svg";
import { IconProps } from "./types";

export const link = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12.667 9.555v2.223c0 .982-.796 1.777-1.778 1.777H4.222a1.777 1.777 0 0 1-1.778-1.777V5.11c0-.982.796-1.778 1.778-1.778h3.111M11.556 1.556l2.889 2.889-2.89 2.888"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M14.222 4.444h-2.889A3.556 3.556 0 0 0 7.778 8"
    ></Path>
  </Svg>
);

export const link01 = (props: IconProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M11.3342 9.10254C10.8649 9.32654 10.4249 9.63321 10.0369 10.0225L10.0236 10.0359C8.18224 11.8772 8.18224 14.8612 10.0236 16.7025L12.9236 19.6025C14.7649 21.4439 17.7489 21.4439 19.5902 19.6025L19.6036 19.5892C21.4449 17.7479 21.4449 14.7639 19.6036 12.9225L18.3622 11.6812"
      stroke="#121212"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.666 14.8976C13.1353 14.6736 13.5753 14.3669 13.9633 13.9776L13.9766 13.9643C15.818 12.1229 15.818 9.13894 13.9766 7.2976L11.0766 4.3976C9.23529 2.55627 6.25129 2.55627 4.40996 4.3976L4.39663 4.41093C2.55529 6.25227 2.55529 9.23627 4.39663 11.0776L5.63796 12.3189"
      stroke="#121212"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const lockOpen = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M5.111 7.333V4.445a2.889 2.889 0 1 1 5.778 0M8 10.444v.89"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M11.333 7.333H4.667c-.982 0-1.778.796-1.778 1.778v3.556c0 .981.796 1.777 1.778 1.777h6.666c.982 0 1.778-.796 1.778-1.777V9.11c0-.982-.796-1.778-1.778-1.778"
    ></Path>
  </Svg>
);

export const locked = (props: IconProps) => (
  <Svg fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M5.111 7.333V4.445a2.889 2.889 0 1 1 5.778 0v2.888M8 10.444v.89"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M11.333 7.333H4.667c-.982 0-1.778.796-1.778 1.778v3.556c0 .981.796 1.777 1.778 1.777h6.666c.982 0 1.778-.796 1.778-1.777V9.11c0-.982-.796-1.778-1.778-1.778"
    ></Path>
  </Svg>
);

export const lock = (props: IconProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M4 15C4 13.0609 4.01234 12.3285 4.19577 11.7639C4.59145 10.5462 5.54618 9.59145 6.76393 9.19577C7.32849 9.01234 8.06089 9 10 9H14C15.9391 9 16.6715 9.01234 17.2361 9.19577C18.4538 9.59145 19.4086 10.5462 19.8042 11.7639C19.9877 12.3285 20 13.0609 20 15C20 16.9391 19.9877 17.6715 19.8042 18.2361C19.4086 19.4538 18.4538 20.4086 17.2361 20.8042C16.6715 20.9877 15.9391 21 14 21H10C8.06089 21 7.32849 20.9877 6.76393 20.8042C5.54618 20.4086 4.59145 19.4538 4.19577 18.2361C4.01234 17.6715 4 16.9391 4 15Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <Path
      d="M8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V9H8V7Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.47534 13.4729C10.1091 12.8424 11.1367 12.8424 11.7705 13.4729L12 13.7012L12.2295 13.4729C12.8633 12.8424 13.8909 12.8424 14.5247 13.4729C15.1584 14.1033 15.1584 15.1255 14.5247 15.756L12.459 17.8109C12.2055 18.063 11.7945 18.063 11.541 17.8109L9.47534 15.756C8.84155 15.1255 8.84155 14.1033 9.47534 13.4729Z"
    />
  </Svg>
);

export const lockedPrice = (props: IconProps) => (
  <Svg width="17" height="17" viewBox="0 0 17 17" {...props}>
    <Path
      d="M8.5 0.649902C10.5095 0.650166 12.1386 2.27907 12.1387 4.28857V7.17725C12.1387 7.27004 12.1187 7.35791 12.0879 7.43994C13.3641 7.5677 14.361 8.64487 14.3613 9.95459V13.5103C14.3613 14.9063 13.2291 16.0386 11.833 16.0386H5.16602C3.77016 16.0383 2.63867 14.9062 2.63867 13.5103V9.95459C2.63902 8.64535 3.63468 7.56835 4.91016 7.43994C4.87942 7.358 4.86133 7.26992 4.86133 7.17725V4.28857C4.86145 2.27898 6.4904 0.65002 8.5 0.649902ZM5.16602 8.92725C4.59882 8.92748 4.13904 9.38742 4.13867 9.95459V13.5103C4.13867 14.0777 4.59859 14.5383 5.16602 14.5386H11.833C12.4006 14.5386 12.8613 14.0779 12.8613 13.5103V9.95459C12.861 9.38728 12.4004 8.92725 11.833 8.92725H5.16602ZM8.65234 10.5591C9.07478 10.1389 9.76007 10.139 10.1826 10.5591C10.6051 10.9794 10.6051 11.6612 10.1826 12.0815L8.80566 13.4517C8.63664 13.6196 8.3623 13.6197 8.19336 13.4517L6.81641 12.0815C6.39397 11.6612 6.39391 10.9794 6.81641 10.5591C7.23887 10.1389 7.92415 10.139 8.34668 10.5591L8.5 10.7114L8.65234 10.5591ZM8.5 2.1499C7.31883 2.15002 6.36145 3.1074 6.36133 4.28857V7.17725C6.36133 7.26534 6.34236 7.34872 6.31445 7.42725H10.6846C10.6566 7.34872 10.6387 7.26534 10.6387 7.17725V4.28857C10.6386 3.10749 9.68105 2.15017 8.5 2.1499Z"
      fill="#FCFCFC"
    />
  </Svg>
);

export const lockedHeart = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      fill="currentColor"
      fillRule="evenodd"
      d="M8 1.65a2.14 2.14 0 0 0-2.139 2.139v2.889a.8.8 0 0 1-.043.25h4.364a.8.8 0 0 1-.043-.25v-2.89A2.14 2.14 0 0 0 8 1.65M4.361 6.678q.001.138.047.263a2.53 2.53 0 0 0-2.27 2.514v3.556a2.53 2.53 0 0 0 2.529 2.528h6.666a2.53 2.53 0 0 0 2.528-2.528V9.455a2.53 2.53 0 0 0-2.27-2.514.8.8 0 0 0 .048-.263v-2.89a3.639 3.639 0 1 0-7.278 0zm.306 1.75c-.568 0-1.028.46-1.028 1.027v3.556c0 .568.46 1.028 1.028 1.028h6.666c.568 0 1.028-.46 1.028-1.028V9.455c0-.567-.46-1.028-1.028-1.028zm3.18 1.631a1.086 1.086 0 0 0-1.53 0 1.07 1.07 0 0 0 0 1.523l1.377 1.37a.434.434 0 0 0 .612 0l1.377-1.37a1.07 1.07 0 0 0 0-1.523 1.086 1.086 0 0 0-1.53 0L8 10.212z"
      clipRule="evenodd"
    ></Path>
  </Svg>
);

export const logout = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <G
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      clipPath="url(#clip0_4099_609)"
    >
      <Path d="M10.445 5.111V2.89A.89.89 0 0 0 9.555 2H3.779a.89.89 0 0 0-.89.889V13.11c0 .49.4.889.89.889h5.778a.89.89 0 0 0 .889-.889V10.89M12.889 5.556 15.333 8l-2.444 2.445M15.333 8H10"></Path>
      <Path d="m3.073 2.354 2.952 1.83c.261.162.42.448.42.756v6.121a.89.89 0 0 1-.42.756l-2.953 1.831"></Path>
    </G>
    <Defs>
      <ClipPath id="clip0_4099_609">
        <Path fill="#fff" d="M0 0h16v16H0z"></Path>
      </ClipPath>
    </Defs>
  </Svg>
);

export const live = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M8 9.555a1.556 1.556 0 1 0 0-3.11 1.556 1.556 0 0 0 0 3.11M5.014 10.986a4.223 4.223 0 0 1 0-5.972M3.129 12.871a6.89 6.89 0 0 1 0-9.742M10.986 10.986a4.223 4.223 0 0 0 0-5.972M12.871 12.871a6.89 6.89 0 0 0 0-9.742"
    ></Path>
  </Svg>
);

export const lipstick = (props: IconProps) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M7.25 7.75V3.29C7.25 3.111 7.346 2.945 7.502 2.856L10.002 1.427C10.335 1.237 10.75 1.477 10.75 1.861V7.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.75 10.75V8.75C5.75 8.198 6.198 7.75 6.75 7.75H11.25C11.802 7.75 12.25 8.198 12.25 8.75V10.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.75 10.75H12.25C12.802 10.75 13.25 11.198 13.25 11.75V14.25C13.25 15.354 12.354 16.25 11.25 16.25H6.75C5.646 16.25 4.75 15.354 4.75 14.25V11.75C4.75 11.198 5.198 10.75 5.75 10.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const leftArrow = (props: IconProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Line
      x1="20"
      y1="12"
      x2="7"
      y2="12"
      stroke="currentColor"
      strokeWidth="2"
    />
    <Line
      x1="11.7071"
      y1="6.70711"
      x2="5.70711"
      y2="12.7071"
      stroke="currentColor"
      strokeWidth="2"
    />
    <Line
      y1="-1"
      x2="8.48528"
      y2="-1"
      transform="matrix(-0.707107 -0.707107 -0.707107 0.707107 11 18)"
      stroke="currentColor"
      strokeWidth="2"
    />
  </Svg>
);

export const lightTheme = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <G
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      clipPath="url(#clip0_5487_1545)"
    >
      <Path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M8 1v1M12.95 3.05l-.707.707M15 8h-1M12.95 12.95l-.707-.707M8 15v-1M3.05 12.95l.707-.707M1 8h1M3.05 3.05l.707.707"></Path>
    </G>
    <Defs>
      <ClipPath id="clip0_5487_1545">
        <Path fill="#fff" d="M0 0h16v16H0z"></Path>
      </ClipPath>
    </Defs>
  </Svg>
);

export const list = (props: IconProps) => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <Path
      d="M3.33333 9.61735C4.06971 9.61735 4.66667 9.0204 4.66667 8.28402C4.66667 7.54764 4.06971 6.95068 3.33333 6.95068C2.59695 6.95068 2 7.54764 2 8.28402C2 9.0204 2.59695 9.61735 3.33333 9.61735Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.33398 8.28418H14.0007"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.33333 4.95085C4.06971 4.95085 4.66667 4.35389 4.66667 3.61751C4.66667 2.88113 4.06971 2.28418 3.33333 2.28418C2.59695 2.28418 2 2.88113 2 3.61751C2 4.35389 2.59695 4.95085 3.33333 4.95085Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.33398 3.61768H14.0007"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.33333 14.2843C4.06971 14.2843 4.66667 13.6874 4.66667 12.951C4.66667 12.2146 4.06971 11.6177 3.33333 11.6177C2.59695 11.6177 2 12.2146 2 12.951C2 13.6874 2.59695 14.2843 3.33333 14.2843Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.33398 12.9507H14.0007"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const letterboxd = ({ color = "currentColor", ...props }: IconProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" {...props}>
    <Rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="4"
      ry="4"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
    />
    <Circle cx="7.5" cy="12" r="3" fill={color} opacity="0.6" />
    <Circle cx="12" cy="12" r="3" fill={color} opacity="0.6" />
    <Circle cx="16.5" cy="12" r="3" fill={color} opacity="0.6" />
  </Svg>
);

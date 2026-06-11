import * as React from "react";
import Svg, { Path, G, Defs, ClipPath, Rect } from "react-native-svg";
import { IconProps } from "./types";

export const dollarSign = (props: IconProps) => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <G clipPath="url(#clip0_1811_3003)">
      <Path
        fillRule="evenodd"
        stroke="currentColor"
        clipRule="evenodd"
        d="M8 2.5C4.96243 2.5 2.5 4.96243 2.5 8C2.5 11.0376 4.96243 13.5 8 13.5C11.0376 13.5 13.5 11.0376 13.5 8C13.5 4.96243 11.0376 2.5 8 2.5ZM1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8ZM8.5 4.5C8.5 4.22386 8.27614 4 8 4C7.72386 4 7.5 4.22386 7.5 4.5V5H7.25C6.78587 5 6.34075 5.18437 6.01256 5.51256C5.68437 5.84075 5.5 6.28587 5.5 6.75C5.5 7.21413 5.68437 7.65925 6.01256 7.98744C6.34075 8.31563 6.78587 8.5 7.25 8.5H8.75C8.94891 8.5 9.13968 8.57902 9.28033 8.71967C9.42098 8.86032 9.5 9.05109 9.5 9.25C9.5 9.44891 9.42098 9.63968 9.28033 9.78033C9.13968 9.92098 8.94891 10 8.75 10H8H6.5C6.22386 10 6 10.2239 6 10.5C6 10.7761 6.22386 11 6.5 11H7.5V11.5C7.5 11.7761 7.72386 12 8 12C8.27614 12 8.5 11.7761 8.5 11.5V11H8.75C9.21413 11 9.65925 10.8156 9.98744 10.4874C10.3156 10.1592 10.5 9.71413 10.5 9.25C10.5 8.78587 10.3156 8.34075 9.98744 8.01256C9.65925 7.68437 9.21413 7.5 8.75 7.5H7.25C7.05109 7.5 6.86032 7.42098 6.71967 7.28033C6.57902 7.13968 6.5 6.94891 6.5 6.75C6.5 6.55109 6.57902 6.36032 6.71967 6.21967C6.86032 6.07902 7.05109 6 7.25 6H8H9.5C9.77614 6 10 5.77614 10 5.5C10 5.22386 9.77614 5 9.5 5H8.5V4.5Z"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_1811_3003">
        <Rect width="16" height="16" />
      </ClipPath>
    </Defs>
  </Svg>
);

export const duplicate = (props: IconProps) => (
  <Svg width="16" height="17" viewBox="0 0 16 17" fill="none" {...props}>
    <Path
      d="M3.33301 11.8335L9.55523 11.8335C10.5371 11.8335 11.333 11.0376 11.333 10.0557L11.333 3.8335C11.333 2.85166 10.5371 2.05572 9.55523 2.05572L3.33301 2.05572C2.35117 2.05572 1.55523 2.85166 1.55523 3.8335L1.55523 10.0557C1.55523 11.0376 2.35117 11.8335 3.33301 11.8335Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.5105 5.83496L14.4251 11.9896C14.5691 12.9612 13.8989 13.8652 12.9283 14.0092L6.77359 14.9238C5.94426 15.0474 5.1647 14.5772 4.86426 13.8323"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const fashion = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M11.69 6.222a42 42 0 0 0 .088 8.222H4.222a41.7 41.7 0 0 0 .088-8.222"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m13.556 7.778 1.555-.667-1.427-3.39a1.78 1.78 0 0 0-1.23-1.04l-2.011-.474.002.025a2.444 2.444 0 1 1-4.889 0q.002-.013.003-.025l-2.011.474c-.553.13-1.011.517-1.23 1.04L.89 7.112l1.555.667"
    ></Path>
  </Svg>
);

export const fitness = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M13.556 8h1.555M4.667 8h6.666M.889 8h1.555M4.667 4a1.111 1.111 0 1 0-2.223 0v8a1.111 1.111 0 1 0 2.223 0zM13.556 4a1.111 1.111 0 0 0-2.223 0v8a1.111 1.111 0 1 0 2.223 0z"
    ></Path>
  </Svg>
);

export const food = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <G clipPath="url(#clip0_4198_490)">
      <Path
        fill="currentColor"
        d="M12 3.111c.245 0 .444.2.444.445a2.223 2.223 0 0 1-2.222 2.222.445.445 0 0 1-.444-.445c0-1.226.995-2.222 2.222-2.222"
      ></Path>
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M2.444 5.111h5.778l-.202 8.466a.89.89 0 0 1-.888.867H3.534a.89.89 0 0 1-.889-.867z"
      ></Path>
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M1.556 1.556h1.87c.454 0 .835.34.884.79l1.023 9.21M10.667 7.34a3.556 3.556 0 1 1-.26 7.072"
      ></Path>
    </G>
    <Defs>
      <ClipPath id="clip0_4198_490">
        <Path fill="#fff" d="M0 0h16v16H0z"></Path>
      </ClipPath>
    </Defs>
  </Svg>
);

export const edit = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m9.875 3.93 2.694 2.695M2.944 13.555s3.2-.505 4.041-1.346l6.513-6.513a1.904 1.904 0 1 0-2.693-2.694L4.292 9.515c-.842.842-1.347 4.041-1.347 4.041z"
    ></Path>
  </Svg>
);

export const eyeClosed = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M1.859 7.27a9.97 9.97 0 0 0 7.141 3 9.97 9.97 0 0 0 7.141-3M4.021 8.942 2.75 11.019M7.3 10.126 6.823 12.5M13.979 8.942l1.271 2.077M10.7 10.126l.477 2.374"
    />
  </Svg>
);

export const eyeOpened = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M1.859 8a9.97 9.97 0 0 1 7.14-3 9.97 9.97 0 0 1 7.142 3"
    />
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9 13.25a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5M4.021 6.328 2.75 4.25M7.3 5.144l-.477-2.375M13.979 6.328 15.25 4.25M10.7 5.144l.477-2.375"
    />
  </Svg>
);

export const ellipses = (props: IconProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 12C4 10.8954 4.89543 10 6 10C7.10457 10 8 10.8954 8 12C8 13.1046 7.10457 14 6 14C4.89543 14 4 13.1046 4 12ZM10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12ZM18 10C16.8954 10 16 10.8954 16 12C16 13.1046 16.8954 14 18 14C19.1046 14 20 13.1046 20 12C20 10.8954 19.1046 10 18 10Z"
      fill="currentColor"
    />
  </Svg>
);

export const dots = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      fill="currentColor"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9 9.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M3.25 9.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M14.75 9.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"
    ></Path>
  </Svg>
);

export const dotsBold = (props: IconProps) => (
  <Svg width="25" height="25" viewBox="0 0 25 25" fill="none" {...props}>
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.77344 12.8398C4.77344 11.7353 5.66887 10.8398 6.77344 10.8398C7.87801 10.8398 8.77344 11.7353 8.77344 12.8398C8.77344 13.9444 7.87801 14.8398 6.77344 14.8398C5.66887 14.8398 4.77344 13.9444 4.77344 12.8398ZM10.7734 12.8398C10.7734 11.7353 11.6689 10.8398 12.7734 10.8398C13.878 10.8398 14.7734 11.7353 14.7734 12.8398C14.7734 13.9444 13.878 14.8398 12.7734 14.8398C11.6689 14.8398 10.7734 13.9444 10.7734 12.8398ZM18.7734 10.8398C17.6689 10.8398 16.7734 11.7353 16.7734 12.8398C16.7734 13.9444 17.6689 14.8398 18.7734 14.8398C19.878 14.8398 20.7734 13.9444 20.7734 12.8398C20.7734 11.7353 19.878 10.8398 18.7734 10.8398Z"
      fill="currentColor"
    />
  </Svg>
);

export const facebook = (props: IconProps) => (
  <Svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <Path d="M12 0C5.372 0 0 5.372 0 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-2.99 1.791-4.669 4.532-4.669 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12 24 5.372 18.628 0 12 0z" />
  </Svg>
);

export const fire = (props: IconProps) => (
  <Svg width="19" height="18" viewBox="0 0 19 18" fill="none" {...props}>
    <Path
      d="M7.46191 16.25C7.18191 13.5 9.26491 14.153 9.33691 11.749C10.9179 12.6 11.5759 14.736 11.5369 16.214"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.5371 16.214C15.4381 14.698 16.2621 10.381 13.5011 6.36401"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.0329 7.37C11.0329 7.37 11.7289 3.604 8.98888 1.75C8.62488 6.125 3.87988 6.281 3.87988 10.987C3.87988 13.104 4.97588 15.389 7.46188 16.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const eyeSlash = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      fill="currentColor"
      d="M7.409 10.591a2.25 2.25 0 1 1 3.182-3.182"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M7.409 10.591a2.25 2.25 0 1 1 3.182-3.182M14.938 6.597c.401.45.725.89.974 1.27.45.683.45 1.582 0 2.265C14.894 11.675 12.65 14.25 9 14.25a7.4 7.4 0 0 1-1.552-.162"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M4.956 13.044c-1.356-.876-2.302-2.053-2.868-2.912a2.07 2.07 0 0 1 0-2.265C3.106 6.324 5.35 3.749 9 3.749c1.62 0 2.964.507 4.044 1.206M2 16 16 2"
    ></Path>
  </Svg>
);

export const eye = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M2.088 10.132a2.07 2.07 0 0 1 0-2.265C3.106 6.324 5.35 3.749 9 3.749s5.896 2.574 6.913 4.118c.45.683.45 1.582 0 2.265C14.894 11.675 12.65 14.25 9 14.25s-5.895-2.574-6.912-4.118"
    ></Path>
    <Path
      fill="currentColor"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5"
    ></Path>
  </Svg>
);

export const download4 = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M15.25 11.75v1.5a2 2 0 0 1-2 2h-8.5a2 2 0 0 1-2-2v-1.5M5.5 6.75l3.5 3.5 3.5-3.5M9 10.25v-7.5"
    ></Path>
  </Svg>
);

export const darkTheme = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M11.556 10.445A5.555 5.555 0 0 1 6 4.889c0-1.202.385-2.31 1.033-3.22a6.443 6.443 0 0 0 1.19 12.776c2.997 0 5.509-2.05 6.23-4.822a5.5 5.5 0 0 1-2.897.822"
    ></Path>
  </Svg>
);

export const expand = (props: IconProps) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M11.25 2.75H13.25C14.355 2.75 15.25 3.645 15.25 4.75V6.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.75 15.25H4.75C3.645 15.25 2.75 14.355 2.75 13.25V11.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.75 6.75V4.75C2.75 3.645 3.645 2.75 4.75 2.75H6.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.25 11.25V13.25C15.25 14.355 14.355 15.25 13.25 15.25H11.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const expireLock = (props: IconProps) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none" {...props}>
    <Path
      d="M19.708 2L22.3747 4.66667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.04167 2L2.375 4.66667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.3753 20.3332C16.9777 20.3332 20.7087 16.6022 20.7087 11.9998C20.7087 7.39746 16.9777 3.6665 12.3753 3.6665C7.77295 3.6665 4.04199 7.39746 4.04199 11.9998C4.04199 16.6022 7.77295 20.3332 12.3753 20.3332Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.48333 17.8921L4.04199 20.3334"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.2666 17.8921L20.7079 20.3334"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.3753 17.3332C11.6393 17.3332 11.042 16.7345 11.042 15.9998C11.042 15.2652 11.6393 14.6665 12.3753 14.6665C13.1113 14.6665 13.7087 15.2652 13.7087 15.9998C13.7087 16.7345 13.1113 17.3332 12.3753 17.3332Z"
      fill="currentColor"
    />
    <Path
      d="M12.375 8V12.3333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const document = (props: IconProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M7.66699 9H10.3337"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.66699 13H13.667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.213 8.33324H15.6663C14.9303 8.33324 14.333 7.73591 14.333 6.99991V2.46924"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.3337 11.9213V8.88525C20.3337 8.53192 20.1937 8.19192 19.943 7.94259L14.7243 2.72392C14.4737 2.47325 14.135 2.33325 13.7817 2.33325H6.33366C4.86033 2.33325 3.66699 3.52792 3.66699 4.99992V18.9999C3.66699 20.4719 4.86033 21.6666 6.33366 21.6666H13.3403"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.6663 19.0001V16.3334C19.6663 15.4134 18.9197 14.6667 17.9997 14.6667C17.0797 14.6667 16.333 15.4134 16.333 16.3334V19.6667C16.333 21.5081 17.825 23.0001 19.6663 23.0001C21.5077 23.0001 22.9997 21.5081 22.9997 19.6667V17.0001"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const discount = (props: IconProps) => (
  <Svg width="20" height="19" fill="none" viewBox="0 0 20 19" {...props}>
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m16.718 9.061-1.473-1.463-.007-2.075a1 1 0 0 0-1.004-.996l-2.075.007-1.473-1.463a1 1 0 0 0-1.414.005L7.809 4.55l-2.075.008a1 1 0 0 0-.996 1.003l.007 2.075-1.463 1.473a1 1 0 0 0 .005 1.414l1.473 1.463.008 2.075a1 1 0 0 0 1.003.997l2.075-.008 1.473 1.463a1 1 0 0 0 1.414-.005l1.463-1.473 2.075-.007a1 1 0 0 0 .996-1.004l-.007-2.075 1.463-1.473a1 1 0 0 0-.005-1.414"
    ></Path>
    <Path
      fill="#000"
      d="M8 8.799a1 1 0 1 0-.008-2 1 1 0 0 0 .007 2M12.013 12.785a1 1 0 1 0-.007-2 1 1 0 0 0 .007 2"
    ></Path>
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m7.76 12.05 4.485-4.516"
    ></Path>
  </Svg>
);

export const discover = (props: IconProps) => (
  <Svg width="23" height="22" viewBox="0 0 23 22" fill="none" {...props}>
    <Path
      d="M11.4996 20.9703C17.0061 20.9703 21.4699 16.5064 21.4699 11C21.4699 5.49352 17.0061 1.02966 11.4996 1.02966C5.99316 1.02966 1.5293 5.49352 1.5293 11C1.5293 16.5064 5.99316 20.9703 11.4996 20.9703Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.9336 7.146C15.0604 7.09449 15.1961 7.1253 15.2852 7.21436C15.3778 7.30704 15.4042 7.446 15.3535 7.56396V7.56494L13.2168 12.5493C13.1923 12.6062 13.1526 12.6539 13.1025 12.688L13.0488 12.7173L8.06445 14.8521C8.02146 14.8698 7.97888 14.8794 7.93848 14.8794C7.85528 14.8793 7.77486 14.8466 7.71387 14.7856C7.62119 14.693 7.5948 14.554 7.64551 14.436V14.4351L9.78223 9.45068C9.81497 9.3748 9.87476 9.31536 9.9502 9.28271L9.94922 9.28174L14.9336 7.146Z"
      stroke="currentColor"
      strokeWidth="2"
    />
  </Svg>
);

export const discoverActive = (props: IconProps) => (
  <Svg width="23" height="22" viewBox="0 0 23 22" fill="none" {...props}>
    <Path
      d="M11.4996 20.9703C17.0061 20.9703 21.4699 16.5064 21.4699 11C21.4699 5.49352 17.0061 1.02966 11.4996 1.02966C5.99316 1.02966 1.5293 5.49352 1.5293 11C1.5293 16.5064 5.99316 20.9703 11.4996 20.9703Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.6389 6.45714L9.65374 8.59364C9.40191 8.70217 9.20165 8.90243 9.09312 9.15482L6.95663 14.14C6.78414 14.5412 6.87458 15.0073 7.18338 15.316C7.38791 15.5206 7.66053 15.629 7.9387 15.629C8.08056 15.629 8.22385 15.6005 8.36016 15.5428L13.3453 13.4063C13.5971 13.2978 13.7974 13.0975 13.9059 12.8451L16.0424 7.85996C16.2149 7.45873 16.1245 6.99269 15.8157 6.68389C15.5069 6.3751 15.0437 6.28679 14.6389 6.45714Z"
      fill="currentColor"
    />
  </Svg>
);

export const flipCamera = (props: IconProps) => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none" {...props}>
    <G clipPath="url(#clip0_1555_43053)">
      <Path
        d="M27.4074 2.00433C27.0434 1.79744 26.5908 1.80366 26.2346 2.02144L22.9337 4.00011C22.7003 4.14011 22.5557 4.39366 22.5557 4.66744V6.223C22.5557 6.49677 22.6988 6.75033 22.9337 6.89033L26.233 8.86744C26.4181 8.97944 26.6266 9.03544 26.835 9.03544C27.0326 9.03544 27.2301 8.98566 27.4074 8.88455C27.773 8.67766 28.0001 8.28877 28.0001 7.86877V3.02011C28.0001 2.59855 27.773 2.20966 27.4074 2.00433Z"
        fill="#FCFCFC"
      />
      <Path
        d="M8.94434 25.2778C10.1234 24.906 11.8657 24.5 13.9999 24.5C15.2366 24.5 17.0192 24.6369 19.0554 25.2778"
        stroke="#FCFCFC"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 20.6113V24.5002"
        stroke="#FCFCFC"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M25.2782 11.4313V17.4996C25.2782 19.2185 23.886 20.6107 22.1671 20.6107H5.83377C4.11488 20.6107 2.72266 19.2185 2.72266 17.4996V7.38845C2.72266 5.66957 4.11488 4.27734 5.83377 4.27734H9.72266"
        stroke="#FCFCFC"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.2224 1.16602H16.3336C14.8301 1.16602 13.6113 2.3848 13.6113 3.88824V6.99935C13.6113 8.50279 14.8301 9.72157 16.3336 9.72157H20.2224C21.7259 9.72157 22.9447 8.50279 22.9447 6.99935V3.88824C22.9447 2.3848 21.7259 1.16602 20.2224 1.16602Z"
        stroke="#FCFCFC"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_1555_43053">
        <Rect width={28} height={28} fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

export const flipCameraCircle = (props: IconProps) => (
  <Svg width="29" height="29" fill="none" viewBox="0 0 29 29" {...props}>
    <G
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      clipPath="url(#clip0_12254_104802)"
    >
      <Path d="m8.471 15.07-3.5-3.5-3.5 3.5"></Path>
      <Path d="M21.712 20.589a9.722 9.722 0 0 1-17.13-6.297c0-.929.131-1.828.374-2.679M20.138 13.514l3.5 3.5 3.5-3.5"></Path>
      <Path d="M6.897 7.995a9.722 9.722 0 0 1 17.13 6.297c0 .9-.123 1.773-.352 2.6"></Path>
    </G>
    <Defs>
      <ClipPath id="clip0_12254_104802">
        <Path fill="#fff" d="M.305.292h28v28h-28z"></Path>
      </ClipPath>
    </Defs>
  </Svg>
);

export const endCall = (props: IconProps) => (
  <Svg width="23" height="23" fill="none" viewBox="0 0 23 23" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m14.657 13.643-1.63 2.037a17.2 17.2 0 0 1-6.111-6.11l2.037-1.63a1.384 1.384 0 0 0 .4-1.644l-1.857-4.18a1.386 1.386 0 0 0-1.615-.78l-3.535.918a1.393 1.393 0 0 0-1.027 1.538A20.54 20.54 0 0 0 18.805 21.28a1.393 1.393 0 0 0 1.538-1.027l.917-3.536a1.385 1.385 0 0 0-.777-1.613L16.3 13.246a1.386 1.386 0 0 0-1.643.399z"
    ></Path>
  </Svg>
);

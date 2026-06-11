import * as React from "react";
import Svg, { Path, G, Defs, ClipPath, Rect } from "react-native-svg";
import { IconProps } from "./types";

export const messageOutline = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <G
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      clipPath="url(#clip0_4045_611)"
    >
      <Path d="M8 1.556A6.445 6.445 0 0 0 1.556 8c0 1.173.318 2.269.865 3.215.382.717-.048 2.41-.865 3.23 1.11.06 2.575-.442 3.229-.865A6.392 6.392 0 0 0 8 14.445a6.445 6.445 0 0 0 0-12.89M5.111 6.444h5.778M5.111 9.556h4"></Path>
    </G>
    <Defs>
      <ClipPath id="clip0_4045_611">
        <Path fill="#fff" d="M0 0h16v16H0z"></Path>
      </ClipPath>
    </Defs>
  </Svg>
);

export const message = (props: IconProps) => (
  <Svg width="17" height="16" viewBox="0 0 17 16" fill="none" {...props}>
    <Path
      d="M8.49999 1.55566C4.94088 1.55566 2.05554 4.441 2.05554 8.00011C2.05554 9.17255 2.37376 10.2686 2.92043 11.2152C3.30265 11.9317 2.87332 13.6259 2.05554 14.4446C3.16665 14.505 4.63065 14.0028 5.28488 13.5797C5.71954 13.8303 6.40843 14.1628 7.31065 14.3334C7.69554 14.4063 8.09376 14.4446 8.49999 14.4446C12.0591 14.4446 14.9444 11.5592 14.9444 8.00011C14.9444 4.441 12.0591 1.55566 8.49999 1.55566Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.61111 6.44434H11.3889"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.61111 9.55566H9.61111"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const mixedMedia = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m5.855 10.883 4.628-4.623a.89.89 0 0 1 1.257 0l2.705 2.705"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M1.556 6v5.778c0 .982.795 1.778 1.777 1.778h7.556"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M6 10.889h6.667c.981 0 1.777-.796 1.777-1.778V4.222c0-.982-.796-1.778-1.777-1.778H6c-.982 0-1.778.796-1.778 1.778v4.89c0 .981.796 1.777 1.778 1.777"
    ></Path>
    <Path
      fill="currentColor"
      d="M7.111 6.222a.89.89 0 0 1-.889-.889.89.89 0 0 1 1.778 0c0 .49-.4.89-.889.89"
    ></Path>
  </Svg>
);

export const minus = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M3.25 9h11.5"
    ></Path>
  </Svg>
);

export const messageContent = (props: IconProps) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none" {...props}>
    <Path
      d="M12.4997 2.33334C7.16101 2.33334 2.83301 6.66134 2.83301 12C2.83301 13.7587 3.31034 15.4027 4.13034 16.8227C4.70367 17.8973 4.05967 20.4387 2.83301 21.6667C4.49967 21.7573 6.69567 21.004 7.67701 20.3693C8.32901 20.7453 9.36234 21.244 10.7157 21.5C11.293 21.6093 11.8903 21.6667 12.4997 21.6667C17.8383 21.6667 22.1663 17.3387 22.1663 12C22.1663 6.66134 17.8383 2.33334 12.4997 2.33334Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.16699 9.66666H16.8337"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.16699 14.3333H14.167"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const messageContentActive = (props: IconProps) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none" {...props}>
    <Path
      d="M12.501 1.58301C18.2535 1.58345 22.917 6.24837 22.917 12.001C22.9166 17.7532 18.2532 22.4166 12.501 22.417C12.0088 22.417 11.5226 22.3826 11.0479 22.3154L10.5771 22.2373C9.36065 22.0072 8.38458 21.5942 7.6875 21.2295C7.14673 21.5184 6.45296 21.798 5.72266 22.0107C4.79701 22.2804 3.74099 22.4675 2.79297 22.416C2.49787 22.3999 2.23973 22.2114 2.13379 21.9355C2.02796 21.6593 2.09464 21.347 2.30371 21.1377C2.7969 20.644 3.21276 19.8333 3.43262 18.9971C3.54059 18.5863 3.59355 18.1948 3.59277 17.8633C3.59187 17.5221 3.53363 17.2972 3.46973 17.1768H3.46875C2.59387 15.6534 2.08315 13.8881 2.08301 12.001C2.08301 6.2481 6.7481 1.58301 12.501 1.58301ZM8.16699 13.584C7.75278 13.584 7.41699 13.9198 7.41699 14.334C7.41726 14.748 7.75294 15.084 8.16699 15.084H14.167C14.5809 15.0838 14.9167 14.7479 14.917 14.334C14.917 13.9199 14.581 13.5842 14.167 13.584H8.16699ZM8.16699 8.91699C7.75278 8.91699 7.41699 9.25278 7.41699 9.66699C7.41726 10.081 7.75294 10.417 8.16699 10.417H16.834L16.9102 10.4131C17.2881 10.3746 17.5837 10.0551 17.584 9.66699C17.584 9.27875 17.2882 8.95941 16.9102 8.9209L16.834 8.91699H8.16699Z"
      fill="currentColor"
    />
  </Svg>
);

export const notification = (props: IconProps) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M17.5 14.7221C16.2722 14.7221 15.2778 13.7277 15.2778 12.4999V7.22211C15.2778 4.30767 12.9144 1.94434 10 1.94434C7.08556 1.94434 4.72222 4.30767 4.72222 7.22211V12.4999C4.72222 13.7277 3.72778 14.7221 2.5 14.7221H17.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.7645 16.8725C11.6589 16.7425 11.5011 16.667 11.3333 16.667H8.66779C8.50002 16.667 8.34224 16.7425 8.23668 16.8725C8.13113 17.0025 8.09002 17.1737 8.12446 17.337C8.31668 18.2503 9.08891 18.8892 10.0011 18.8892C10.9134 18.8892 11.6856 18.2503 11.8778 17.337C11.9122 17.1737 11.87 17.0025 11.7645 16.8725Z"
      fill="currentColor"
    />
  </Svg>
);

export const notificationActive = (props: IconProps) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M17.5 14.7221C16.2722 14.7221 15.2778 13.7277 15.2778 12.4999V7.22211C15.2778 4.30767 12.9144 1.94434 10 1.94434C7.08556 1.94434 4.72222 4.30767 4.72222 7.22211V12.4999C4.72222 13.7277 3.72778 14.7221 2.5 14.7221H17.5Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.7645 16.8725C11.6589 16.7425 11.5011 16.667 11.3333 16.667H8.66779C8.50002 16.667 8.34224 16.7425 8.23668 16.8725C8.13113 17.0025 8.09002 17.1737 8.12446 17.337C8.31668 18.2503 9.08891 18.8892 10.0011 18.8892C10.9134 18.8892 11.6856 18.2503 11.8778 17.337C11.9122 17.1737 11.87 17.0025 11.7645 16.8725Z"
      fill="currentColor"
    />
  </Svg>
);

export const notificationFilled = (props: IconProps) => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <Path
      d="M14 11.7795C13.7665 11.7797 13.5352 11.7338 13.3194 11.6445C13.1037 11.5552 12.9076 11.4242 12.7425 11.2591C12.5773 11.0939 12.4464 10.8979 12.3571 10.6821C12.2678 10.4663 12.2219 10.2351 12.222 10.0015V5.77954C12.198 4.67571 11.7426 3.62518 10.9534 2.85301C10.1643 2.08084 9.10409 1.64844 8 1.64844C6.89591 1.64844 5.83572 2.08084 5.04656 2.85301C4.2574 3.62518 3.80203 4.67571 3.778 5.77954V10.0015C3.778 10.9835 2.982 11.7795 2 11.7795H14Z"
      fill="currentColor"
      stroke="currentColor"
    />
    <Path
      d="M9.41187 13.497C9.37049 13.4453 9.31797 13.4037 9.25823 13.3751C9.1985 13.3465 9.13309 13.3318 9.06687 13.332H6.93387C6.86779 13.3321 6.80255 13.3469 6.74291 13.3754C6.68328 13.4038 6.63075 13.4453 6.58917 13.4966C6.54758 13.548 6.51799 13.608 6.50254 13.6722C6.48709 13.7365 6.48618 13.8034 6.49987 13.868C6.65287 14.598 7.27087 15.11 7.99987 15.11C8.72987 15.11 9.34787 14.599 9.50187 13.868C9.51498 13.8034 9.51372 13.7366 9.49816 13.6725C9.48261 13.6084 9.45315 13.5485 9.41187 13.497Z"
      fill="currentColor"
    />
  </Svg>
);

export const noNotification = (props: IconProps) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none" {...props}>
    <Path
      d="M18.324 6.17592C17.356 3.91725 15.1133 2.33325 12.5 2.33325C9.00267 2.33325 6.16667 5.16925 6.16667 8.66658V14.9999C6.16667 16.4733 4.97333 17.6666 3.5 17.6666H6.83333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.167 17.6666H21.5003C20.027 17.6666 18.8337 16.4733 18.8337 14.9999V10.3333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.6176 20.2467C14.491 20.0907 14.3016 20 14.1003 20H10.9016C10.7003 20 10.511 20.0907 10.3843 20.2467C10.2576 20.4027 10.2083 20.608 10.2496 20.804C10.4803 21.9 11.407 22.6667 12.5016 22.6667C13.5963 22.6667 14.523 21.9 14.7536 20.804C14.795 20.608 14.7443 20.4027 14.6176 20.2467Z"
      fill="currentColor"
    />
    <Path
      d="M3.16699 21.3334L21.8337 2.66675"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const openEnvelope = (props: IconProps) => (
  <Svg width={16} height={17} viewBox="0 0 16 17" fill="none" {...props}>
    <Path
      d="M1.55554 6.49994C1.55554 5.85283 1.90754 5.29016 2.47465 4.97728L7.57065 2.16572C7.83821 2.01816 8.16176 2.01816 8.42932 2.16572L13.5253 4.97728C14.0924 5.29016 14.4444 5.85194 14.4444 6.49994"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.4444 6.50356V12.2778C14.4444 13.26 13.6489 14.0556 12.6667 14.0556H3.33332C2.3511 14.0556 1.55554 13.26 1.55554 12.2778V6.5L7.61332 9.42444C7.85776 9.54267 8.14221 9.54267 8.38576 9.42444L14.4435 6.5L14.4444 6.50356Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const mute = (props: IconProps) => (
  <Svg width="17" height="17" viewBox="0 0 17 17" fill="none" {...props}>
    <G clipPath="url(#clip0_11008_151708)">
      <Path
        d="M12.7222 5.07146V2.86791C12.7222 2.51679 12.3338 2.30435 12.0378 2.49368L7.16667 5.6119H3.83333C3.09733 5.6119 2.5 6.20924 2.5 6.94524V10.0563C2.5 10.7923 3.09733 11.3897 3.83333 11.3897H6.17111"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 12.2423L12.0387 14.5072C12.3347 14.6966 12.7231 14.4841 12.7231 14.133V8.15967"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.94531 14.5L15.3898 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_11008_151708">
        <Rect
          width="16"
          height="16"
          fill="white"
          transform="translate(0.5 0.5)"
        />
      </ClipPath>
    </Defs>
  </Svg>
);

export const mug = (props: IconProps) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M14.0331 7.25H15.7501C16.3021 7.25 16.7501 7.698 16.7501 8.25V9.75C16.7501 10.855 15.8551 11.75 14.7501 11.75H13.6411"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4.84092 4.75H13.1589C13.7449 4.75 14.2059 5.252 14.1549 5.837L13.4079 14.424C13.3179 15.458 12.4529 16.251 11.4159 16.251H6.58392C5.54692 16.251 4.68092 15.458 4.59192 14.424L3.84492 5.837C3.79392 5.253 4.25492 4.75 4.84092 4.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 2C7.127 1.96 7.406 1.854 7.646 1.583C7.941 1.25 7.989 0.877 8 0.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.25 2C10.377 1.96 10.656 1.854 10.896 1.583C11.191 1.25 11.239 0.877 11.25 0.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12.5C10.1046 12.5 11 11.6046 11 10.5C11 9.39543 10.1046 8.5 9 8.5C7.89543 8.5 7 9.39543 7 10.5C7 11.6046 7.89543 12.5 9 12.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const openBook = (props: IconProps) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M9.00002 15.051C9.17002 15.051 9.33902 15.006 9.49402 14.917C10.137 14.546 11.226 14.07 12.635 14.072C13.534 14.073 14.302 14.269 14.905 14.507C15.553 14.762 16.249 14.267 16.249 13.57V4.487C16.249 4.133 16.068 3.807 15.763 3.627C15.126 3.251 14.037 2.764 12.623 2.764C10.733 2.764 9.42502 3.636 8.99902 3.946"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.9963 6.9204C13.583 6.825 13.1234 6.764 12.6231 6.764C12.1228 6.764 11.6632 6.8251 11.25 6.9207"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.9963 10.4204C13.583 10.325 13.1234 10.264 12.6231 10.264C12.1228 10.264 11.6632 10.3251 11.25 10.4207"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.99998 15.051C8.82998 15.051 8.66098 15.006 8.50598 14.917C7.86298 14.546 6.77398 14.07 5.36498 14.072C4.46598 14.073 3.69798 14.269 3.09498 14.507C2.44698 14.762 1.75098 14.27 1.75098 13.574V4.484C1.75098 4.13 1.93198 3.808 2.23698 3.628C2.87398 3.252 3.96298 2.765 5.37698 2.765C7.26698 2.765 8.57498 3.637 9.00098 3.947V15.051H8.99998Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const messageBlast = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M3.778 4.889 8.64 7.928c.288.18.654.18.942 0l4.862-3.04"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M5.111 11.333h8c.736 0 1.333-.597 1.333-1.333V4.667c0-.737-.597-1.334-1.333-1.334h-8c-.736 0-1.333.597-1.333 1.334V10c0 .736.597 1.333 1.333 1.333"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M10.889 13.556H5.111A3.556 3.556 0 0 1 1.556 10V6.889"
    ></Path>
  </Svg>
);

export const mic = (props: IconProps) => (
  <Svg width="29" height="29" viewBox="0 0 29 29" fill="none" {...props}>
    <Path
      d="M19.1531 8.61806C19.1531 5.82595 16.8897 3.5625 14.0975 3.5625C11.3054 3.5625 9.04199 5.82595 9.04199 8.61806V13.2847C9.04199 16.0768 11.3054 18.3403 14.0975 18.3403C16.8897 18.3403 19.1531 16.0768 19.1531 13.2847V8.61806Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M23.8194 13.2852C23.8194 18.6549 19.467 23.0074 14.0972 23.0074C8.72744 23.0074 4.375 18.6549 4.375 13.2852"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.0977 23.0059V26.117"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const mediaUpload = (props: IconProps) => (
  <Svg width="57" height="56" viewBox="0 0 57 56" fill="none" {...props}>
    <Path
      d="M12.2031 46.6286L31.1 27.7286C33.5298 25.2988 37.4685 25.2988 39.8982 27.7286L47.9436 35.7739"
      stroke="currentColor"
      strokeWidth="1.9294"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.9436 26.4418C22.0914 26.4418 23.8325 24.7007 23.8325 22.553C23.8325 20.4052 22.0914 18.6641 19.9436 18.6641C17.7958 18.6641 16.0547 20.4052 16.0547 22.553C16.0547 24.7007 17.7958 26.4418 19.9436 26.4418Z"
      fill="#121212"
    />
    <Path
      d="M44.8281 3.89062V19.4462"
      stroke="currentColor"
      strokeWidth="1.9294"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M29.9334 8.55469H15.2769C11.8404 8.55469 9.05469 11.3407 9.05469 14.7769V41.2214C9.05469 44.6576 11.8404 47.4436 15.2769 47.4436H41.7214C45.1579 47.4436 47.9436 44.6576 47.9436 41.2214V26.5652"
      stroke="currentColor"
      strokeWidth="1.9294"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M52.6102 11.6641H37.0547"
      stroke="currentColor"
      strokeWidth="1.9294"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const micRegular = (props: IconProps) => (
  <Svg width="16" height="17" viewBox="0 0 16 17" fill="none" {...props}>
    <Path
      d="M10.8889 4.94443C10.8889 3.34894 9.59546 2.05554 7.99997 2.05554C6.40448 2.05554 5.11108 3.34894 5.11108 4.94443V7.6111C5.11108 9.20659 6.40448 10.5 7.99997 10.5C9.59546 10.5 10.8889 9.20659 10.8889 7.6111V4.94443Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.5556 7.61108C13.5556 10.6795 11.0685 13.1666 8.00001 13.1666C4.93157 13.1666 2.44446 10.6795 2.44446 7.61108"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 13.1666V14.9444"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const messageCheck = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <G
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      clipPath="url(#clip0_6226_19)"
    >
      <Path d="m1.75 5.75 6.767 3.733a1 1 0 0 0 .966 0L16.25 5.75"></Path>
      <Path d="M16.25 9.474V5.25a2 2 0 0 0-2-2H3.75a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h6.007M12.25 14.75l1.609 1.5 3.397-4.5"></Path>
    </G>
    <Defs>
      <ClipPath id="clip0_6226_19">
        <Path fill="currentColor" d="M0 0h18v18H0z"></Path>
      </ClipPath>
    </Defs>
  </Svg>
);

export const money = (props: IconProps) => (
  <Svg width="21" height="21" viewBox="0 0 21 21" fill="none" {...props}>
    <Path
      d="M11.9045 8.5222C11.5479 7.94553 10.9768 7.80664 10.5323 7.80664C10.0645 7.80664 8.83676 8.05553 8.9512 9.23442C9.0312 10.0622 9.8112 10.37 10.4923 10.4911C11.1734 10.6122 12.1634 10.8722 12.1879 11.87C12.209 12.7133 11.4501 13.2889 10.5334 13.2889C9.77342 13.2889 9.21565 13.0333 8.92676 12.4622"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.5 7.16699V7.80699"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.5 13.29V13.8334"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.05545 4.66699C6.05545 6.66144 4.43878 8.2781 2.44434 8.2781"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.9443 4.66699C14.9443 6.66144 16.561 8.2781 18.5554 8.2781"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.05545 16.3338C6.05545 14.3393 4.43878 12.7227 2.44434 12.7227"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.9443 16.3338C14.9443 14.3393 16.561 12.7227 18.5554 12.7227"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.3332 4.66699H4.66656C3.43926 4.66699 2.44434 5.66191 2.44434 6.88921V14.1114C2.44434 15.3387 3.43926 16.3337 4.66656 16.3337H16.3332C17.5605 16.3337 18.5554 15.3387 18.5554 14.1114V6.88921C18.5554 5.66191 17.5605 4.66699 16.3332 4.66699Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const messageDelete = (props: IconProps) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none" {...props}>
    <G clipPath="url(#clip0_6936_86448)">
      <Path
        d="M2.83301 7.66675L11.8557 12.6441C12.257 12.8654 12.7423 12.8654 13.1437 12.6441L22.1663 7.66675"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22.1663 11.6118V6.99992C22.1663 5.52725 20.9725 4.33325 19.4997 4.33325H5.49967C4.02687 4.33325 2.83301 5.52725 2.83301 6.99992V16.9999C2.83301 18.4726 4.02687 19.6666 5.49967 19.6666H11.565"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.1663 22.9999C21.5596 22.9999 23.4997 21.0598 23.4997 18.6666C23.4997 16.2734 21.5596 14.3333 19.1663 14.3333C16.7731 14.3333 14.833 16.2734 14.833 18.6666C14.833 21.0598 16.7731 22.9999 19.1663 22.9999Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.1025 21.7308L22.2232 15.6101"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_6936_86448">
        <Rect
          width="24"
          height="24"
          fill="white"
          transform="translate(0.5)"
        />
      </ClipPath>
    </Defs>
  </Svg>
);

export const micOff = (props: IconProps) => (
  <Svg width={24} height={26} viewBox="0 0 24 26" fill="none" {...props}>
    <Path
      d="M17.0554 6.77821C17.0554 3.98611 14.792 1.72266 11.9999 1.72266C9.20779 1.72266 6.94434 3.98611 6.94434 6.77821V11.4449C6.94434 14.237 9.20779 16.5004 11.9999 16.5004C14.792 16.5004 17.0554 14.237 17.0554 11.4449V6.77821Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.9469 19.0535C3.71157 17.2724 2.27734 14.5253 2.27734 11.4453"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21.7226 11.4453C21.7226 16.8151 17.3701 21.1675 12.0003 21.1675C11.1806 21.1675 10.3857 21.0664 9.625 20.8751"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 21.166V24.2771"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1.11133 23.8891L22.8891 2.11133"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

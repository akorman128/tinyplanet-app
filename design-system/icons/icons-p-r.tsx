import * as React from "react";
import Svg, { Path, G, Defs, ClipPath, Rect, Circle } from "react-native-svg";
import { IconProps } from "./types";

export const readArrow = (props: IconProps) => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <G clipPath="url(#clip0_13229_403)">
      <Path
        d="M0.666748 8.44437L4.00008 12.6666L11.1112 3.55548"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.56079 11.8293L8.22212 12.6666L15.3332 3.55548"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_13229_403">
        <Rect width="16" height="16" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

export const play = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      fill="currentColor"
      d="M12.63 7.249 5.588 2.783a.89.89 0 0 0-1.366.751v8.933a.89.89 0 0 0 1.366.75l7.042-4.466a.89.89 0 0 0 0-1.501z"
    />
  </Svg>
);

export const payment = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M1.556 6.444h12.889M3.333 12.667h9.334c.981 0 1.777-.796 1.777-1.778V5.111c0-.982-.796-1.778-1.777-1.778H3.333c-.982 0-1.778.796-1.778 1.778v5.778c0 .982.796 1.778 1.778 1.778M3.778 10h2.666M11.333 10h.89"
    ></Path>
  </Svg>
);

export const profile = (props: IconProps) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none" {...props}>
    <Path
      d="M12.4997 9.66665C14.5247 9.66665 16.1663 8.02502 16.1663 5.99998C16.1663 3.97494 14.5247 2.33331 12.4997 2.33331C10.4746 2.33331 8.83301 3.97494 8.83301 5.99998C8.83301 8.02502 10.4746 9.66665 12.4997 9.66665Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.8498 20.688C19.9965 20.3267 20.5991 19.06 20.1125 17.9613C18.8191 15.04 15.9005 13 12.5005 13C9.10047 13 6.1818 15.04 4.88847 17.9613C4.4018 19.0613 5.00447 20.3267 6.15114 20.688C7.78447 21.2027 9.9458 21.6667 12.5005 21.6667C15.0551 21.6667 17.2165 21.2027 18.8498 20.688Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const profileRegular = (props: IconProps) => (
  <Svg width={16} height={17} viewBox="0 0 16 17" fill="none" {...props}>
    <Path
      d="M7.99999 6.94443C9.35002 6.94443 10.4444 5.85002 10.4444 4.49999C10.4444 3.14996 9.35002 2.05554 7.99999 2.05554C6.64996 2.05554 5.55554 3.14996 5.55554 4.49999C5.55554 5.85002 6.64996 6.94443 7.99999 6.94443Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.2328 14.292C12.9973 14.0511 13.3991 13.2066 13.0746 12.4742C12.2124 10.5266 10.2666 9.16663 7.99995 9.16663C5.73328 9.16663 3.7875 10.5266 2.92528 12.4742C2.60084 13.2075 3.00261 14.0511 3.76706 14.292C4.85595 14.6351 6.29684 14.9444 7.99995 14.9444C9.70306 14.9444 11.1439 14.6351 12.2328 14.292Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const profileActive = (props: IconProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M11.9997 9.66665C14.0247 9.66665 15.6663 8.02502 15.6663 5.99998C15.6663 3.97494 14.0247 2.33331 11.9997 2.33331C9.97463 2.33331 8.33301 3.97494 8.33301 5.99998C8.33301 8.02502 9.97463 9.66665 11.9997 9.66665Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.3498 20.688C19.4965 20.3267 20.0991 19.06 19.6125 17.9613C18.3191 15.04 15.4005 13 12.0005 13C8.60047 13 5.6818 15.04 4.38847 17.9613C3.9018 19.0613 4.50447 20.3267 5.65114 20.688C7.28447 21.2027 9.4458 21.6667 12.0005 21.6667C14.5551 21.6667 16.7165 21.2027 18.3498 20.688Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const profileBlocked = (props: IconProps) => (
  <Svg width="16" height="17" viewBox="0 0 16 17" fill="none" {...props}>
    <G clipPath="url(#clip0_8218_105219)">
      <Path
        d="M7.99913 6.72873C9.34916 6.72873 10.4436 5.63432 10.4436 4.28429C10.4436 2.93426 9.34916 1.83984 7.99913 1.83984C6.6491 1.83984 5.55469 2.93426 5.55469 4.28429C5.55469 5.63432 6.6491 6.72873 7.99913 6.72873Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.92387 9.03335C8.62342 8.98268 8.31587 8.95068 8.00031 8.95068C5.73276 8.95068 3.78787 10.3107 2.92565 12.2574C2.6012 12.9907 3.00298 13.8342 3.76742 14.0751C4.79765 14.4005 6.15231 14.6858 7.73631 14.716"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.4436 15.6176C14.0391 15.6176 15.3325 14.3242 15.3325 12.7287C15.3325 11.1332 14.0391 9.83984 12.4436 9.83984C10.8481 9.83984 9.55469 11.1332 9.55469 12.7287C9.55469 14.3242 10.8481 15.6176 12.4436 15.6176Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.4023 14.7714L14.4823 10.6914"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_8218_105219">
        <Rect
          width="16"
          height="16"
          fill="white"
          transform="translate(0 0.28418)"
        />
      </ClipPath>
    </Defs>
  </Svg>
);

export const plus = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9 3.25v11.5M3.25 9h11.5"
    ></Path>
  </Svg>
);

export const pinOutline = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m2.739 13.261 2.958-2.958M9.219 13.825a6.649 6.649 0 0 0 1.414-3.928l2.67-2.671a1.777 1.777 0 0 0 0-2.514l-2.015-2.016a1.777 1.777 0 0 0-2.514 0l-2.67 2.671a6.7 6.7 0 0 0-1.513.216 6.75 6.75 0 0 0-2.416 1.198z"
    ></Path>
  </Svg>
);

export const pin = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m2.739 13.261 2.958-2.958"
    ></Path>
    <Path
      fill="currentColor"
      d="M9.219 13.825a6.649 6.649 0 0 0 1.414-3.928l2.67-2.671a1.777 1.777 0 0 0 0-2.514l-2.015-2.016a1.777 1.777 0 0 0-2.514 0l-2.67 2.671a6.7 6.7 0 0 0-1.513.216 6.75 6.75 0 0 0-2.416 1.198z"
    ></Path>
  </Svg>
);

export const pieChart2 = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9 1.75V9M14.411 4.174 9 9M13.106 14.975 9 9M9 16.25a7.25 7.25 0 1 0 0-14.5 7.25 7.25 0 0 0 0 14.5"
    ></Path>
  </Svg>
);

export const pieChart2Active = (props: IconProps) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none" {...props}>
    <Path
      d="M12.987 21.6666C18.3257 21.6666 22.6536 17.3387 22.6536 11.9999C22.6536 6.66117 18.3257 2.33325 12.987 2.33325C7.64823 2.33325 3.32031 6.66117 3.32031 11.9999C3.32031 17.3387 7.64823 21.6666 12.987 21.6666Z"
      fill="currentColor"
    />
    <Path
      d="M12.9868 2.33325V11.9999"
      stroke="strokeCurrentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.2015 5.56543L12.9868 12.0001"
      stroke="strokeCurrentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.4615 19.9667L12.9868 12"
      stroke="strokeCurrentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const posts = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M11.778 2.444H4.222c-.982 0-1.778.796-1.778 1.778v7.556c0 .981.796 1.777 1.778 1.777h7.556c.981 0 1.777-.796 1.777-1.777V4.222c0-.982-.796-1.778-1.777-1.778M5.111 10.889h3.111M5.111 8.222h5.778"
    ></Path>
    <Path
      fill="currentColor"
      d="M5.333 6.222a.889.889 0 1 0 0-1.778.889.889 0 0 0 0 1.778"
    ></Path>
  </Svg>
);

export const postsActive = (props: IconProps) => (
  <Svg width="25" height="25" viewBox="0 0 25 25" fill="none" {...props}>
    <Path
      d="M18.4033 3.69019H7.06999C5.59723 3.69019 4.40332 4.88409 4.40332 6.35685V17.6902C4.40332 19.1629 5.59723 20.3569 7.06999 20.3569H18.4033C19.8761 20.3569 21.07 19.1629 21.07 17.6902V6.35685C21.07 4.88409 19.8761 3.69019 18.4033 3.69019Z"
      fill="currentColor"
    />
    <Path
      d="M8.40332 16.3567H13.07"
      stroke="strokeCurrentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.40332 12.3567H17.07"
      stroke="strokeCurrentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.73665 9.35685C9.47303 9.35685 10.07 8.7599 10.07 8.02352C10.07 7.28714 9.47303 6.69019 8.73665 6.69019C8.00027 6.69019 7.40332 7.28714 7.40332 8.02352C7.40332 8.7599 8.00027 9.35685 8.73665 9.35685Z"
      fill="#strokeCurrentColor"
    />
  </Svg>
);

export const qrCode = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M6.75 2.75h-3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1M14.25 2.75h-3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1M6.75 10.25h-3a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1"
    ></Path>
    <Path
      fill="currentColor"
      d="M6 4.5H4.5V6H6zM13.5 4.5H12V6h1.5zM6 12H4.5v1.5H6zM16 14.5h-1.5V16H16zM14.5 13H13v1.5h1.5zM16 11.5h-1.5V13H16zM13 14.5h-2V16h2zM11 11.5H9.5v3H11zM14.5 10H11v1.5h3.5z"
    ></Path>
  </Svg>
);

export const pause = (props: IconProps) => (
  <Svg
    width="16"
    height="16"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="0"
    viewBox="0 0 512 512"
    {...props}
  >
    <Path stroke="none" d="M224 432h-80V80h80zm144 0h-80V80h80z"></Path>
  </Svg>
);

export const redo = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M15 10c-.528-.461-2.7-2.251-6-2.251S3.528 9.539 3 10"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M13.374 5.598 14.999 10l-4.53 1.222"
    ></Path>
  </Svg>
);

export const reloadLeft = (props: IconProps) => (
  <Svg width="17" height="16" viewBox="0 0 17 16" fill="none" {...props}>
    <Path
      d="M8.50005 15.1111C6.14183 15.1111 3.94272 13.9458 2.61561 11.9929C2.4085 11.6889 2.48761 11.2738 2.7925 11.0667C3.0965 10.8605 3.51161 10.9378 3.71872 11.2436C4.79694 12.8302 6.58539 13.7778 8.50094 13.7778C11.6867 13.7778 14.2787 11.1858 14.2787 8.00003C14.2787 4.81425 11.6867 2.22225 8.50094 2.22225C6.20316 2.22225 4.12405 3.58314 3.20405 5.68892C3.05561 6.0258 2.66361 6.18047 2.32583 6.03292C1.98805 5.88536 1.83427 5.49247 1.98183 5.15469C3.11339 2.56358 5.6725 0.888916 8.50005 0.888916C12.4209 0.888916 15.6112 4.07914 15.6112 8.00003C15.6112 11.9209 12.4209 15.1111 8.50005 15.1111Z"
      fill="currentColor"
    />
    <Path
      d="M2.53293 6.22216C2.20493 6.22216 1.91959 5.98039 1.87337 5.64705L1.5107 3.02927C1.46004 2.66394 1.71426 2.32794 2.07959 2.27727C2.44404 2.22394 2.78093 2.48083 2.83159 2.84616L3.1027 4.8035L5.05915 4.53239C5.42093 4.48439 5.76048 4.73683 5.81115 5.10216C5.86181 5.46661 5.6067 5.8035 5.24137 5.85416L2.62448 6.21594C2.59337 6.2195 2.56404 6.22216 2.53293 6.22216Z"
      fill="currentColor"
    />
  </Svg>
);

export const reloadRight = (props: IconProps) => (
  <Svg width="17" height="16" viewBox="0 0 17 16" fill="none" {...props}>
    <Path
      d="M13.8333 11.6187C12.6742 13.3244 10.7178 14.4444 8.49999 14.4444C4.94088 14.4444 2.05554 11.5591 2.05554 7.99999C2.05554 4.44088 4.94088 1.55554 8.49999 1.55554C11.1942 1.55554 13.5018 3.20888 14.4644 5.55554"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.8289 2.93774L14.4663 5.55552L11.8494 5.19374"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const rename = (props: IconProps) => (
  <Svg width="16" height="17" viewBox="0 0 16 17" fill="none" {...props}>
    <Path
      d="M9.11091 12.2778L5.83536 3.83337H5.29313L2.01758 12.2778"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.88086 10.0555H8.24975"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.2227 3.83337V13.1667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.4453 2.05554C11.4275 2.05554 12.2231 2.8511 12.2231 3.83332"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.0004 2.05554C13.0182 2.05554 12.2227 2.8511 12.2227 3.83332"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.4453 14.9444C11.4275 14.9444 12.2231 14.1488 12.2231 13.1666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.0004 14.9444C13.0182 14.9444 12.2227 14.1488 12.2227 13.1666"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.8887 9.16663H13.5553"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const redoCircle = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M15 13.071a7.25 7.25 0 1 1 .71-6.821"
    ></Path>
    <Path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m16.12 3.305-.408 2.945-2.944-.407"
    ></Path>
  </Svg>
);

export const phone = () => (
  <Svg width="73" height="73" viewBox="0 0 73 73" fill="none">
    <Rect
      x="0.304688"
      y="0.291992"
      width="72"
      height="72"
      rx="36"
      fill="currentColor"
    />
    <Path
      d="M39.6569 38.6434L38.0269 40.6805C35.5027 39.1963 33.3984 37.0935 31.9156 34.5692L33.9527 32.9393C34.4441 32.5464 34.6084 31.8707 34.3527 31.2964L32.4956 27.1151C32.2199 26.4951 31.537 26.1666 30.8813 26.3366L27.3457 27.2537C26.6629 27.4322 26.2214 28.0937 26.3186 28.7922C27.5928 37.8692 34.727 45.0033 43.8053 46.279C44.5039 46.3747 45.1653 45.9333 45.3425 45.2519L46.2596 41.7162C46.4296 41.0605 46.101 40.3791 45.4825 40.1034L41.3011 38.2463C40.7268 37.9906 40.0526 38.1549 39.6583 38.6449L39.6569 38.6434Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const reply = (props: IconProps) => (
  <Svg width="17" height="17" viewBox="0 0 17 17" fill="none" {...props}>
    <Path
      d="M2.96582 6.39453H11.6325C13.4734 6.39453 14.9658 7.88698 14.9658 9.72786C14.9658 11.5688 13.4734 13.0612 11.6325 13.0612H8.29915"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.07693 9.50738L2.96582 6.39627L6.07693 3.28516"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const reddit = (props: IconProps) => (
  <Svg width="1em" height="1em" viewBox="0 0 256 256" {...props}>
    <Circle cx="128" cy="128" r="128" fill="#ff4500" />
    <Path
      fill="#fff"
      d="M213.15 129.22c0-10.376-8.391-18.617-18.617-18.617a18.74 18.74 0 0 0-12.97 5.189c-12.818-9.157-30.368-15.107-49.9-15.87l8.544-39.981l27.773 5.95c.307 7.02 6.104 12.667 13.278 12.667c7.324 0 13.275-5.95 13.275-13.278c0-7.324-5.95-13.275-13.275-13.275c-5.188 0-9.768 3.052-11.904 7.478l-30.976-6.562c-.916-.154-1.832 0-2.443.458c-.763.458-1.22 1.22-1.371 2.136l-9.464 44.558c-19.837.612-37.692 6.562-50.662 15.872a18.74 18.74 0 0 0-12.971-5.188c-10.377 0-18.617 8.391-18.617 18.617c0 7.629 4.577 14.037 10.988 16.939a33.6 33.6 0 0 0-.458 5.646c0 28.686 33.42 52.036 74.621 52.036c41.202 0 74.622-23.196 74.622-52.036a35 35 0 0 0-.458-5.646c6.408-2.902 10.985-9.464 10.985-17.093M85.272 142.495c0-7.324 5.95-13.275 13.278-13.275c7.324 0 13.275 5.95 13.275 13.275s-5.95 13.278-13.275 13.278c-7.327.15-13.278-5.953-13.278-13.278m74.317 35.251c-9.156 9.157-26.553 9.768-31.588 9.768c-5.188 0-22.584-.765-31.59-9.768c-1.371-1.373-1.371-3.51 0-4.883c1.374-1.371 3.51-1.371 4.884 0c5.8 5.8 18.008 7.782 26.706 7.782s21.058-1.983 26.704-7.782c1.374-1.371 3.51-1.371 4.884 0c1.22 1.373 1.22 3.51 0 4.883m-2.443-21.822c-7.325 0-13.275-5.95-13.275-13.275s5.95-13.275 13.275-13.275c7.327 0 13.277 5.95 13.277 13.275c0 7.17-5.95 13.275-13.277 13.275"
    />
  </Svg>
);

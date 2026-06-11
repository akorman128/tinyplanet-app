import * as React from "react";
import Svg, { Path, G, Defs, ClipPath, Rect, Circle } from "react-native-svg";
import { IconProps } from "./types";

export const audience = (props: IconProps) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
    <G clipPath="url(#clip0_1234_52109)">
      <Path
        d="M8.00043 8.50001C8.98227 8.50001 9.77821 7.70408 9.77821 6.72224C9.77821 5.7404 8.98227 4.94446 8.00043 4.94446C7.01859 4.94446 6.22266 5.7404 6.22266 6.72224C6.22266 7.70408 7.01859 8.50001 8.00043 8.50001Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.15663 14.5231C4.72196 14.3915 4.42951 13.9586 4.5264 13.5142C4.87574 11.9169 6.29796 10.7213 8.00018 10.7213C9.7024 10.7213 11.1246 11.9169 11.474 13.5142C11.5708 13.9578 11.2793 14.3915 10.8437 14.5231C10.114 14.7435 9.14507 14.9444 8.00018 14.9444C6.85529 14.9444 5.8864 14.7444 5.15663 14.5231Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.222 4.72221C12.9584 4.72221 13.5553 4.12526 13.5553 3.38888C13.5553 2.6525 12.9584 2.05554 12.222 2.05554C11.4856 2.05554 10.8887 2.6525 10.8887 3.38888C10.8887 4.12526 11.4856 4.72221 12.222 4.72221Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.0742 6.94264C12.1231 6.94086 12.172 6.93909 12.2218 6.93909C13.7089 6.93909 14.9587 7.95864 15.3089 9.33642C15.4244 9.79064 15.1213 10.2431 14.6707 10.3738C14.0991 10.5391 13.3756 10.6866 12.5347 10.716"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.77767 4.72221C4.51405 4.72221 5.111 4.12526 5.111 3.38888C5.111 2.6525 4.51405 2.05554 3.77767 2.05554C3.04129 2.05554 2.44434 2.6525 2.44434 3.38888C2.44434 4.12526 3.04129 4.72221 3.77767 4.72221Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.92537 6.94264C3.87648 6.94086 3.82759 6.93909 3.77781 6.93909C2.2907 6.93909 1.04092 7.95864 0.690701 9.33642C0.575146 9.79064 0.878257 10.2431 1.32892 10.3738C1.90048 10.5391 2.62403 10.6866 3.46492 10.716"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_1234_52109">
        <Rect
          width="16"
          height="16"
          fill="white"
          transform="translate(0 0.5)"
        />
      </ClipPath>
    </Defs>
  </Svg>
);

export const arrowLeft = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M2.444 8h11.111M6.222 4.222C5.074 7.333 2.444 8 2.444 8s2.63.667 3.778 3.778"
    />
  </Svg>
);

export const arrowRight = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M13.555 8H2.445M9.778 11.778C10.926 8.667 13.556 8 13.556 8s-2.63-.667-3.778-3.778"
    />
  </Svg>
);

export const arrowDown = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M8 13.555V2.445M4.222 9.778C7.333 10.926 8 13.556 8 13.556s.667-2.63 3.778-3.778"
    />
  </Svg>
);

export const arrowUp = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M8 2.444v11.111M11.778 6.222C8.667 5.074 8 2.444 8 2.444s-.667 2.63-3.778 3.778"
    />
  </Svg>
);

export const arrowTopLeft = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m3.333 3.334 9.334 9.333M8.675 3.334c-3.011 1.388-5.342 0-5.342 0s1.389 2.33 0 5.342"
    />
  </Svg>
);

export const arrowTopRight = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m12.667 3.334-9.334 9.333M12.667 8.676c-1.389-3.012 0-5.342 0-5.342s-2.331 1.388-5.343 0"
    />
  </Svg>
);

export const arrowBottomLeft = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m3.333 12.667 9.334-9.333M3.333 7.324c1.389 3.012 0 5.342 0 5.342s2.33-1.388 5.342 0"
    />
  </Svg>
);

export const arrowBottomRight = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12.667 12.667 3.333 3.334M7.324 12.666c3.012-1.388 5.343 0 5.343 0s-1.389-2.33 0-5.342"
    />
  </Svg>
);

export const check = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M2.444 8.222 6 12.667l7.555-9.333"
    />
  </Svg>
);

export const close = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m12.445 3.556-8.89 8.889M3.556 3.556l8.889 8.889"
    />
  </Svg>
);

export const closeThick = (props: IconProps) => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none" {...props}>
    <Path
      d="M21.7782 6.22266L6.22266 21.7782"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.22266 6.22266L21.7782 21.7782"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const comment = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12.667 2H3.333c-.982 0-1.777.796-1.777 1.778V10c0 .981.795 1.778 1.777 1.778h1.778v2.666l3.334-2.666h4.222c.982 0 1.778-.797 1.778-1.778V3.778c0-.982-.796-1.778-1.778-1.778"
    ></Path>
  </Svg>
);

export const addImage = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.413"
      d="m3.344 13.324 5.399-5.4a1.777 1.777 0 0 1 2.514 0l2.298 2.298"
    ></Path>
    <Path
      fill="currentColor"
      d="M5.555 7.555a1.111 1.111 0 1 0 0-2.222 1.111 1.111 0 0 0 0 2.222"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.413"
      d="M12.666 1.111v4.445M8.41 2.445H4.222c-.982 0-1.777.796-1.777 1.777v7.556c0 .982.795 1.778 1.777 1.778h7.556c.982 0 1.778-.796 1.778-1.778V7.59M14.889 3.333h-4.445"
    ></Path>
  </Svg>
);

export const beat = (props: IconProps) => (
  <Svg width="33" height="32" fill="none" viewBox="0 0 33 32" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M2.39 14.667v2.667M29.056 14.667v2.667M7.723 6.667v18.667M13.056 10.223v11.555M18.39 4.89V27.11M23.723 10.223v11.555"
    ></Path>
  </Svg>
);

export const chevronDown = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M13.555 6.667 8 10.445 2.444 6.666"
    ></Path>
  </Svg>
);

export const chevronLeft = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9.333 13.555 5.556 8l3.777-5.556"
    ></Path>
  </Svg>
);

export const chevronDoubleLeft = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M8.25 13.25 4 9l4.25-4.25M13 13.25 8.75 9 13 4.75"
    ></Path>
  </Svg>
);

export const chevronDoubleRight = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9.75 4.75 14 9l-4.25 4.25M5 4.75 9.25 9 5 13.25"
    ></Path>
  </Svg>
);

export const chevronRight = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M6.667 2.444 10.445 8l-3.778 5.555"
    ></Path>
  </Svg>
);

export const chevronTop = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M2.444 9.333 8 5.556l5.555 3.777"
    ></Path>
  </Svg>
);

export const calendar = (props: IconProps) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M6.38885 4.09722V1.875"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.6111 4.09722V1.875"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.2778 4.09668H4.72222C3.49492 4.09668 2.5 5.0916 2.5 6.3189V15.7633C2.5 16.9906 3.49492 17.9856 4.72222 17.9856H15.2778C16.5051 17.9856 17.5 16.9906 17.5 15.7633V6.3189C17.5 5.0916 16.5051 4.09668 15.2778 4.09668Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.5 7.98633H17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const calendarScheduler = (props: IconProps) => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <G clipPath="url(#clip0_14245_7323)">
      <Path
        d="M12.2222 2.44434H3.77778C2.79594 2.44434 2 3.24027 2 4.22211V11.7777C2 12.7595 2.79594 13.5554 3.77778 13.5554H12.2222C13.2041 13.5554 14 12.7595 14 11.7777V4.22211C14 3.24027 13.2041 2.44434 12.2222 2.44434Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.11108 2.44428V0.666504"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.8889 2.44428V0.666504"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 5.55566H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 11.3334V7.77783"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.22217 9.55566H9.77772"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_14245_7323">
        <Rect width="16" height="16" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

export const calendarActive = (props: IconProps) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <Path
      d="M6.38885 4.09722V1.875"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.6111 4.09722V1.875"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.25 15.7637C18.2498 17.405 16.9187 18.7354 15.2773 18.7354H4.72266C3.08125 18.7354 1.75018 17.405 1.75 15.7637V8.73633H18.25V15.7637ZM15.4307 3.35059C17.001 3.43015 18.2498 4.72924 18.25 6.31934V7.23633H1.75V6.31934C1.75016 4.67796 3.08124 3.34668 4.72266 3.34668H15.2773L15.4307 3.35059Z"
      fill="currentColor"
    />
  </Svg>
);

export const calendarDays = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <G clipPath="url(#clip0_5488_140)">
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M5.111 2.445V.667M10.889 2.445V.667M12.222 2.444H3.778C2.796 2.444 2 3.24 2 4.222v7.556c0 .981.796 1.777 1.778 1.777h8.444c.982 0 1.778-.796 1.778-1.777V4.222c0-.982-.796-1.778-1.778-1.778M2 5.556h12"
      ></Path>
      <Path
        fill="currentColor"
        d="M8 7.333a.89.89 0 0 0-.889.89c0 .489.4.888.889.888.49 0 .889-.4.889-.889A.89.89 0 0 0 8 7.333M11.111 9.111c.49 0 .889-.4.889-.889a.89.89 0 0 0-.889-.889.89.89 0 0 0-.889.89c0 .489.4.888.89.888M8 10a.89.89 0 0 0-.889.889c0 .49.4.889.889.889A.89.89 0 0 0 8 10M4.889 10a.89.89 0 0 0-.889.889c0 .49.4.889.889.889a.89.89 0 0 0 0-1.778M11.111 10a.89.89 0 0 0-.889.889.89.89 0 0 0 1.778 0A.89.89 0 0 0 11.11 10"
      ></Path>
    </G>
    <Defs>
      <ClipPath id="clip0_5488_140">
        <Path fill="currentColor" d="M0 0h16v16H0z"></Path>
      </ClipPath>
    </Defs>
  </Svg>
);

export const archive = (props: IconProps) => (
  <Svg width="16" height="17" viewBox="0 0 16 17" fill="none" {...props}>
    <Path
      d="M13.1111 6.05554V12.2778C13.1111 13.26 12.3156 14.0555 11.3334 14.0555H4.66669C3.68447 14.0555 2.88892 13.26 2.88892 12.2778V6.05554"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.5555 2.94446H2.44443C1.95351 2.94446 1.55554 3.34243 1.55554 3.83335V5.16668C1.55554 5.6576 1.95351 6.05557 2.44443 6.05557H13.5555C14.0465 6.05557 14.4444 5.6576 14.4444 5.16668V3.83335C14.4444 3.34243 14.0465 2.94446 13.5555 2.94446Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.22266 8.72223H9.77821"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const beauty = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M6.444 6.889V2.925c0-.16.086-.307.224-.386l2.223-1.27a.445.445 0 0 1 .664.385V6.89"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M5.111 9.556V7.778A.89.89 0 0 1 6 6.888h4a.89.89 0 0 1 .889.89v1.778"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M5.111 9.556h5.778a.89.89 0 0 1 .889.889v2.222c0 .981-.797 1.778-1.778 1.778H6a1.78 1.78 0 0 1-1.778-1.778v-2.222a.89.89 0 0 1 .89-.89"
    ></Path>
  </Svg>
);

export const comedy = (props: IconProps) => (
  <Svg
    width="18"
    height="18"
    fill="currentColor"
    viewBox="0 0 18 18"
    {...props}
  >
    <G clipPath="url(#clip0_4198_470)">
      <Path
        fill="currentColor"
        d="M10.575 9.562a.6.6 0 0 0-.518-.168 13.4 13.4 0 0 1-4.123-.001.59.59 0 0 0-.508.164.62.62 0 0 0-.172.532A2.795 2.795 0 0 0 8 12.445a2.795 2.795 0 0 0 2.746-2.359.61.61 0 0 0-.171-.523z"
      ></Path>
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M13.06 11.991A6.43 6.43 0 0 1 8 14.445c-2.052 0-3.88-.96-5.06-2.454M14.222 6.317a6.447 6.447 0 0 0-12.444 0"
      ></Path>
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M4.444 7.333a1.112 1.112 0 0 1 2.223 0M9.333 7.333a1.112 1.112 0 0 1 2.223 0"
      ></Path>
      <Path
        fill="currentColor"
        d="M.425 10.593a1.347 1.347 0 0 0 1.903-.069c.462-.495.539-1.44.537-2.022a.49.49 0 0 0-.523-.488c-.581.039-1.518.18-1.98.676a1.347 1.347 0 0 0 .063 1.904zM15.575 10.593a1.347 1.347 0 0 1-1.903-.069c-.462-.495-.539-1.44-.537-2.022a.49.49 0 0 1 .523-.488c.581.039 1.518.18 1.98.676.509.545.48 1.397-.063 1.904z"
      ></Path>
    </G>
    <Defs>
      <ClipPath id="clip0_4198_470">
        <Path fill="currentColor" d="M0 0h16v16H0z"></Path>
      </ClipPath>
    </Defs>
  </Svg>
);

export const apple = (props: IconProps) => (
  <Svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <Path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </Svg>
);

export const chartLine = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="m2.75 10.75 3.646-3.646a.5.5 0 0 1 .707 0l3.293 3.293a.5.5 0 0 0 .707 0l4.146-4.146"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M2.75 2.75v10a2 2 0 0 0 2 2h10.5"
    ></Path>
  </Svg>
);

export const chartLineActive = (props: IconProps) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M14.5879 0.336914C16.3049 0.424013 17.6707 1.84441 17.6709 3.58301V14.4209C17.6707 16.2155 16.2155 17.6707 14.4209 17.6709H3.58301C1.84441 17.6707 0.424013 16.3049 0.336914 14.5879L0.333008 14.4209V3.58301C0.333239 1.78842 1.78842 0.333239 3.58301 0.333008H14.4209L14.5879 0.336914ZM16.3535 4.98047C16.0607 4.68763 15.5859 4.68774 15.293 4.98047L14.6152 5.65723L13.2617 7.01172L11.083 9.18945L7.44727 5.55371C7.17267 5.27912 6.73794 5.26167 6.44336 5.50195L6.38672 5.55371L3.46973 8.46973L2.01172 9.92871L1.28223 10.6572C0.98955 10.9501 0.989549 11.4249 1.28223 11.7178C1.57507 12.0106 2.04989 12.0105 2.34277 11.7178L3.07227 10.9893L4.53027 9.53027L6.91602 7.14355L10.5527 10.7803C10.8456 11.0731 11.3204 11.073 11.6133 10.7803L14.3223 8.07227L15.6758 6.71777L16.3535 6.04102C16.6462 5.74818 16.6461 5.27333 16.3535 4.98047Z"
      fill="currentColor"
    />
  </Svg>
);

export const badgeCheck2 = (props: IconProps) => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
    <G clipPath="url(#clip0_4498_227946)">
      <Path
        d="M17.9781 9.15365L16.2337 7.40909V4.94316C16.2337 4.28717 15.7014 3.75477 15.0455 3.75477H12.5798L10.8354 2.0102C10.3708 1.54673 9.61863 1.54673 9.15521 2.0102L7.41083 3.75477H4.94517C4.28925 3.75477 3.7569 4.28717 3.7569 4.94316V7.40909L2.01252 9.15365C1.54791 9.61713 1.54791 10.3706 2.01252 10.834L3.7569 12.5786V15.0445C3.7569 15.7005 4.28925 16.2329 4.94517 16.2329H7.41083L9.15521 17.9775C9.61982 18.441 10.372 18.441 10.8354 17.9775L12.5798 16.2329H15.0455C15.7014 16.2329 16.2337 15.7005 16.2337 15.0445V12.5786L17.9781 10.834C18.4427 10.3706 18.4427 9.61713 17.9781 9.15365Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.875 10.8078L8.905 13.0556L13.2639 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_4498_227946">
        <Rect width={20} height={20} fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

export const badgeCheck2Active = (props: IconProps) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
    <G clipPath="url(#clip0_4498_227950)">
      <Path
        d="M8.62305 1.47955C9.33233 0.770249 10.4546 0.726584 11.2158 1.34576L11.3633 1.47858L12.8887 3.00397H15.0439C16.1138 3.00421 16.9812 3.87268 16.9814 4.94244V7.09772L18.5059 8.62213L18.6387 8.76959C19.2607 9.53054 19.2162 10.654 18.5059 11.3633L16.9814 12.8887V15.044C16.9814 16.114 16.114 16.9822 15.0439 16.9825H12.8887L11.3643 18.5069C10.6076 19.2636 9.38102 19.2629 8.62402 18.5079L7.09863 16.9825H4.94336C3.87322 16.9824 3.00488 16.1141 3.00488 15.044V12.8887L1.48047 11.3643C0.722676 10.6078 0.722426 9.37848 1.48047 8.62213H1.48145L3.00488 7.09772V4.94244C3.00515 3.87259 3.87338 3.00406 4.94336 3.00397H7.09863L8.62305 1.47955ZM13.6572 6.63287C13.3313 6.37725 12.8602 6.43397 12.6045 6.75983L8.79492 11.6143L7.3623 10.0274C7.08467 9.72022 6.61007 9.69619 6.30273 9.97369C5.99537 10.2513 5.97141 10.7259 6.24902 11.0333L8.2793 13.2813C8.42748 13.4449 8.64069 13.535 8.86133 13.5274C9.08224 13.5196 9.28932 13.4152 9.42578 13.2413L13.7842 7.68561C14.0397 7.3599 13.9827 6.88865 13.6572 6.63287Z"
        fill="currentColor"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_4498_227950">
        <Rect width="20" height="20" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

export const closeEnvelope = (props: IconProps) => (
  <Svg width={16} height={17} viewBox="0 0 16 17" fill="none" {...props}>
    <Path
      d="M1.55554 5.61108L7.57065 8.92931C7.83821 9.07686 8.16176 9.07686 8.42932 8.92931L14.4444 5.61108"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.33335 13.6111L12.6667 13.6111C13.6485 13.6111 14.4445 12.8151 14.4445 11.8333L14.4445 5.16664C14.4445 4.1848 13.6485 3.38886 12.6667 3.38886L3.33335 3.38886C2.35151 3.38886 1.55557 4.1848 1.55557 5.16664L1.55557 11.8333C1.55557 12.8151 2.35151 13.6111 3.33335 13.6111Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const community = (props: IconProps) => (
  <Svg width="16" height="16" fill="none" viewBox="0 0 16 16" {...props}>
    <G
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      clipPath="url(#clip0_5344_217)"
    >
      <Path d="M4.045 9.556a1.778 1.778 0 1 0 0-3.556 1.778 1.778 0 0 0 0 3.556M.667 14.222a3.557 3.557 0 0 1 6.757 0M14 .667H9.111c-.736 0-1.333.597-1.333 1.333v3.111c0 .736.597 1.334 1.333 1.334h.445V9.11L12 6.445h2c.736 0 1.333-.598 1.333-1.334v-3.11c0-.737-.597-1.334-1.333-1.334"></Path>
    </G>
    <Defs>
      <ClipPath id="clip0_5344_217">
        <Path fill="#fff" d="M0 0h16v16H0z"></Path>
      </ClipPath>
    </Defs>
  </Svg>
);

export const communityActive = (props: IconProps) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M5.05669 11.9444C6.28399 11.9444 7.27892 10.9495 7.27892 9.72222C7.27892 8.49492 6.28399 7.5 5.05669 7.5C3.8294 7.5 2.83447 8.49492 2.83447 9.72222C2.83447 10.9495 3.8294 11.9444 5.05669 11.9444Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M0.833313 17.7782C1.41665 16.0038 3.08665 14.7227 5.05665 14.7227C7.02665 14.7227 8.69665 16.0038 9.27998 17.7782"
      fill="currentColor"
    />
    <Path
      d="M0.833313 17.7782C1.41665 16.0038 3.08665 14.7227 5.05665 14.7227C7.02665 14.7227 8.69665 16.0038 9.27998 17.7782H0.833313Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17.5 0.833008H11.3889C10.4689 0.833008 9.72223 1.57967 9.72223 2.49967V6.38856C9.72223 7.30856 10.4689 8.05523 11.3889 8.05523H11.9445V11.3886L15 8.05523H17.5C18.42 8.05523 19.1667 7.30856 19.1667 6.38856V2.49967C19.1667 1.57967 18.42 0.833008 17.5 0.833008Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const bicep = (props: IconProps) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M5.22395 5.671C4.47095 8.777 6.30595 9.095 7.04795 10.868C8.09395 9.629 11.6779 8.221 13.9859 9.405C16.2939 10.589 16.5409 13.836 14.6629 15.069C13.5559 15.795 11.8599 16.243 10.3409 16.244C8.60995 16.288 7.36095 16.108 6.81795 15.836C5.91995 15.951 4.02295 15.938 3.24795 15.149C2.71595 14.608 1.62995 11.503 2.28095 8.191C2.97195 4.695 4.12495 1.751 5.36995 1.751C5.97995 1.751 6.97095 1.771 7.43395 2.146C7.89695 2.521 7.68295 3.342 7.41895 3.794C7.74195 4.053 7.81095 4.518 7.57795 4.86C7.20195 5.288 6.71295 5.601 6.16695 5.763C5.85395 5.848 5.47995 5.747 5.22395 5.671Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.75 13C10.188 13.506 12.035 13.129 13.25 12.297"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const basketBall = (props: IconProps) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M8.65195 1.759C8.15795 2.196 5.25595 4.85 5.15595 9.218C5.06995 12.977 7.11495 15.509 7.63895 16.121"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1.77002 9.532C2.96102 9.943 4.39502 10.314 6.03802 10.499C10.517 11.003 14.173 9.857 16.25 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.14697 13.277C3.14697 13.277 4.29397 12.609 5.66697 12.609C7.86997 12.609 10.333 14.896 13.905 14.336"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.14697 4.722C3.84397 6.25 3.29197 7.924 5.27097 7.924C9.33397 7.924 9.99997 3.937 14.189 3.937"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 16.25C13.0041 16.25 16.25 13.0041 16.25 9C16.25 4.99594 13.0041 1.75 9 1.75C4.99594 1.75 1.75 4.99594 1.75 9C1.75 13.0041 4.99594 16.25 9 16.25Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const controller = (props: IconProps) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M10.75 8C11.1642 8 11.5 7.66421 11.5 7.25C11.5 6.83579 11.1642 6.5 10.75 6.5C10.3358 6.5 10 6.83579 10 7.25C10 7.66421 10.3358 8 10.75 8Z"
      fill="currentColor"
    />
    <Path
      d="M13.75 8C14.1642 8 14.5 7.66421 14.5 7.25C14.5 6.83579 14.1642 6.5 13.75 6.5C13.3358 6.5 13 6.83579 13 7.25C13 7.66421 13.3358 8 13.75 8Z"
      fill="currentColor"
    />
    <Path
      d="M12.25 6.75C12.6642 6.75 13 6.41421 13 6C13 5.58579 12.6642 5.25 12.25 5.25C11.8358 5.25 11.5 5.58579 11.5 6C11.5 6.41421 11.8358 6.75 12.25 6.75Z"
      fill="currentColor"
    />
    <Path
      d="M12.25 9.25C12.6642 9.25 13 8.91421 13 8.5C13 8.08579 12.6642 7.75 12.25 7.75C11.8358 7.75 11.5 8.08579 11.5 8.5C11.5 8.91421 11.8358 9.25 12.25 9.25Z"
      fill="currentColor"
    />
    <Path
      d="M5.75 6V8.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 7.25H4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.22998 11.75H11.769"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.75 13C6.57843 13 7.25 12.3284 7.25 11.5C7.25 10.6716 6.57843 10 5.75 10C4.92157 10 4.25 10.6716 4.25 11.5C4.25 12.3284 4.92157 13 5.75 13Z"
      fill="currentColor"
    />
    <Path
      d="M12.25 13C13.0784 13 13.75 12.3284 13.75 11.5C13.75 10.6716 13.0784 10 12.25 10C11.4216 10 10.75 10.6716 10.75 11.5C10.75 12.3284 11.4216 13 12.25 13Z"
      fill="currentColor"
    />
    <Path
      d="M14.173 13.435C14.44 13.952 14.992 14.297 15.625 14.245C16.427 14.18 17.006 13.44 17 12.636C16.992 11.451 16.832 10.009 16.542 8.375C15.871 4.588 14.424 2.75 12.5 2.75C11.615 2.75 10.828 3.14 10.279 3.75H9.00003H7.72103C7.17203 3.14 6.38503 2.75 5.50003 2.75C3.57603 2.75 2.12903 4.588 1.45803 8.375C1.16903 10.009 1.00803 11.45 1.00003 12.636C0.995032 13.44 1.57403 14.18 2.37503 14.245C3.00803 14.297 3.56003 13.951 3.82703 13.435"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const chefHat = (props: IconProps) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M4.75 13.75H13.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.75 12V13.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.25 12V13.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.91207 3.983C5.37307 3.753 4.76707 3.682 4.12007 3.815C2.94807 4.056 2.00207 5.033 1.79707 6.212C1.46807 8.106 2.91707 9.75 4.75007 9.75V15.25C4.75007 15.802 5.19807 16.25 5.75007 16.25H12.2501C12.8021 16.25 13.2501 15.802 13.2501 15.25V9.75C15.0821 9.75 16.5311 8.107 16.2041 6.214C16.0001 5.034 15.0541 4.057 13.8821 3.815C13.2341 3.681 12.6281 3.752 12.0881 3.982"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.75 5C5.75 3.205 7.205 1.75 9 1.75C10.795 1.75 12.25 3.205 12.25 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const copy = (props: IconProps) => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <G clipPath="url(#clip0_13524_106106)">
      <Path
        d="M3.33301 11.3335L9.55523 11.3335C10.5371 11.3335 11.333 10.5376 11.333 9.55572L11.333 3.3335C11.333 2.35166 10.5371 1.55572 9.55523 1.55572L3.33301 1.55572C2.35117 1.55572 1.55523 2.35166 1.55523 3.3335L1.55523 9.55572C1.55523 10.5376 2.35117 11.3335 3.33301 11.3335Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.5105 5.33496L14.4251 11.4896C14.5691 12.4612 13.8989 13.3652 12.9283 13.5092L6.77359 14.4238C5.94426 14.5474 5.1647 14.0772 4.86426 13.3323"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_13524_106106">
        <Rect width="16" height="16" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

export const copy2 = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M4.75 12.25h-1a2 2 0 0 1-2-2v-5.5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2v1"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M6.75 15.25h7.5a2 2 0 0 0 2-2v-5.5a2 2 0 0 0-2-2h-7.5a2 2 0 0 0-2 2v5.5a2 2 0 0 0 2 2"
    ></Path>
  </Svg>
);

export const bold = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      fill="currentColor"
      d="M12.653 8.471A3.98 3.98 0 0 0 14 5.5c0-2.206-1.794-4-4-4H6.25a.75.75 0 0 0 0 1.5H10c1.379 0 2.5 1.122 2.5 2.5S11.379 8 10 8H6.25a.75.75 0 0 0 0 1.5h4.5a2.75 2.75 0 0 1 2.75 2.75A2.75 2.75 0 0 1 10.75 15h-4.5a.75.75 0 0 0 0 1.5h4.5A4.255 4.255 0 0 0 15 12.25c0-1.656-.961-3.078-2.347-3.779"
    ></Path>
    <Path
      fill="currentColor"
      d="M6 1.5H4.75A1.75 1.75 0 0 0 3 3.25v11.5c0 .966.784 1.75 1.75 1.75H6z"
    ></Path>
  </Svg>
);

export const clock = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9 16.25a7.25 7.25 0 1 0 0-14.5 7.25 7.25 0 0 0 0 14.5"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9 4.75V9l3.25 2.25"
    ></Path>
  </Svg>
);

export const compose = (props: IconProps) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none" {...props}>
    <Path
      d="M20.8334 11.6667V17.6667C20.8334 19.14 19.64 20.3334 18.1667 20.3334H6.83335C5.36002 20.3334 4.16669 19.14 4.16669 17.6667V6.33335C4.16669 4.86002 5.36002 3.66669 6.83335 3.66669H12.8334"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.5 15C9.5 15 12.3267 14.84 13.2813 13.8853L21.6147 5.55198C22.3507 4.81598 22.3507 3.62131 21.6147 2.88531C20.8787 2.14931 19.684 2.14931 18.948 2.88531L10.6147 11.2186C9.66 12.1733 9.5 15 9.5 15Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const circleCheck = (props: IconProps) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M11.626 3.334C10.827 2.963 9.939 2.75 9 2.75C5.548 2.75 2.75 5.548 2.75 9C2.75 12.452 5.548 15.25 9 15.25C12.452 15.25 15.25 12.452 15.25 9C15.25 8.363 15.153 7.749 14.976 7.17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.25 7.673L9.019 10.75L15.25 2.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const card = (props: IconProps) => (
  <Svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M2.333 9.667h19.334M5 19h14a2.667 2.667 0 0 0 2.667-2.667V7.667A2.667 2.667 0 0 0 19 5H5a2.667 2.667 0 0 0-2.667 2.667v8.666A2.667 2.667 0 0 0 5 19M5.667 15h4"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M17 15h1.333"
    ></Path>
  </Svg>
);

export const applePay = (props: IconProps) => (
  <Svg width="24" height="24" fill="none" viewBox="0 0 24 24" {...props}>
    <Path
      fill="currentColor"
      d="M2.258 4.77h19.484a2.24 2.24 0 0 1 1.595.669c.409.413.663.983.663 1.61v9.902c0 .627-.254 1.197-.663 1.61s-.974.67-1.595.67H2.258a2.24 2.24 0 0 1-1.595-.67A2.28 2.28 0 0 1 0 16.951V7.05c0-.627.254-1.197.663-1.61s.974-.67 1.595-.67m19.484.785H2.258A1.496 1.496 0 0 0 .778 7.05v9.902a1.496 1.496 0 0 0 1.48 1.494h19.484a1.496 1.496 0 0 0 1.48-1.494V7.05a1.496 1.496 0 0 0-1.48-1.494"
    ></Path>
    <Path
      fill="currentColor"
      fillRule="evenodd"
      d="M15.732 14.606v-.472c.043.011.139.011.187.011.267 0 .411-.113.5-.404 0-.005.05-.172.05-.175l-1.014-2.836h.624l.71 2.306h.011l.71-2.306h.608l-1.051 2.982c-.24.687-.518.907-1.1.907a2 2 0 0 1-.235-.013m-7.538-4.55a.95.95 0 0 0 .216-.675.93.93 0 0 0-.617.322c-.134.156-.252.41-.221.65.237.02.473-.12.622-.297m.214.343c-.344-.02-.637.197-.8.197-.165 0-.416-.187-.688-.182a1.01 1.01 0 0 0-.862.529c-.37.642-.098 1.596.261 2.119.175.259.385.544.662.534.262-.01.365-.171.683-.171s.41.17.687.165c.287-.005.467-.259.642-.518.2-.295.282-.58.287-.595-.005-.006-.554-.218-.56-.856-.004-.533.432-.787.452-.803-.246-.367-.63-.409-.764-.42zm2.993-.722c.747 0 1.268.52 1.268 1.277s-.531 1.282-1.287 1.282h-.827v1.328h-.598V9.677zm-.846 2.052h.686c.52 0 .817-.282.817-.773 0-.49-.297-.77-.814-.77h-.689zm2.27 1.03c0-.496.376-.8 1.043-.838l.769-.046v-.218c0-.315-.21-.504-.563-.504-.334 0-.542.162-.593.415h-.544c.032-.512.464-.89 1.158-.89s1.116.365 1.116.933v1.953h-.553v-.466h-.013c-.163.315-.518.514-.886.514-.55 0-.934-.345-.934-.854m1.812-.257v-.223l-.691.043c-.344.024-.54.178-.54.42s.204.41.513.41c.403 0 .718-.28.718-.65"
      clipRule="evenodd"
    ></Path>
  </Svg>
);

export const ban = (props: IconProps) => (
  <Svg width="16" height="17" viewBox="0 0 16 17" fill="none" {...props}>
    <Path
      d="M3.44287 13.0574L12.5495 3.95068"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.00011 14.9444C11.5593 14.9444 14.4446 12.0592 14.4446 8.49999C14.4446 4.94082 11.5593 2.05554 8.00011 2.05554C4.44094 2.05554 1.55566 4.94082 1.55566 8.49999C1.55566 12.0592 4.44094 14.9444 8.00011 14.9444Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const beli = ({ color = "currentColor", ...props }: IconProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" {...props}>
    <Circle
      cx="12"
      cy="12"
      r="10"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M8 7h4.5c1.38 0 2.5 1.12 2.5 2.5S13.88 12 12.5 12H8V7zm0 5h5c1.38 0 2.5 1.12 2.5 2.5S14.38 17 13 17H8v-5z"
      fill={color}
    />
  </Svg>
);

export const bookmark = (props: IconProps) => (
  <Svg
    width={props.size || 24}
    height={props.size || 24}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <Path
      d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z"
      stroke={props.color || "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={props.fill || "none"}
    />
  </Svg>
);

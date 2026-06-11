import * as React from "react";
import Svg, { Path, G, Defs, ClipPath, Rect } from "react-native-svg";
import { IconProps } from "./types";

export const unreadArrow = (props: IconProps) => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <Path
      d="M2.44446 8.22287L6.00001 12.6673L13.5556 3.33398"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const signOut = (props: IconProps) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
    <G clipPath="url(#clip0_6646_31254)">
      <Path
        id="Vector"
        d="M13.0555 6.38889V3.61111C13.0555 2.99778 12.5578 2.5 11.9444 2.5H4.72221C4.10887 2.5 3.6111 2.99778 3.6111 3.61111V16.3889C3.6111 17.0022 4.10887 17.5 4.72221 17.5H11.9444C12.5578 17.5 13.0555 17.0022 13.0555 16.3889V13.6111"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        id="Vector_2"
        d="M16.1111 6.94434L19.1667 9.99989L16.1111 13.0554"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        id="Vector_3"
        d="M19.1667 10H12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        id="Vector_4"
        d="M3.8411 2.94214L7.5311 5.22992C7.85776 5.43214 8.05665 5.78992 8.05665 6.17436V13.8266C8.05665 14.211 7.85776 14.5677 7.5311 14.771L3.83998 17.0599"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_6646_31254">
        <Rect width="20" height="20" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

export const signOutActive = (props: IconProps) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M13.0555 6.38889V3.61111C13.0555 2.99778 12.5578 2.5 11.9444 2.5H4.7222C4.10886 2.5 3.61108 2.99778 3.61108 3.61111V16.3889C3.61108 17.0022 4.10886 17.5 4.7222 17.5H11.9444C12.5578 17.5 13.0555 17.0022 13.0555 16.3889V13.6111"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.1111 6.94434L19.1666 9.99989L16.1111 13.0554"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.1667 10H12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.8412 2.94238L7.5312 5.23016C7.85787 5.43238 8.05675 5.79016 8.05675 6.17461V13.8268C8.05675 14.2113 7.85787 14.5679 7.5312 14.7713L3.84009 17.0602"
      fill="currentColor"
    />
    <Path
      d="M3.8412 2.94238L7.5312 5.23016C7.85787 5.43238 8.05675 5.79016 8.05675 6.17461V13.8268C8.05675 14.2113 7.85787 14.5679 7.5312 14.7713L3.84009 17.0602"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const unlocked = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <G
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      clipPath="url(#clip0_4078_1148)"
    >
      <Path d="M6.445 7.333V4.445a2.889 2.889 0 1 0-5.778 0v1.11M8.444 10.444v.89"></Path>
      <Path d="M11.778 7.333H5.11c-.982 0-1.778.796-1.778 1.778v3.556c0 .981.796 1.777 1.778 1.777h6.667c.981 0 1.777-.796 1.777-1.777V9.11c0-.982-.796-1.778-1.777-1.778"></Path>
    </G>
    <Defs>
      <ClipPath id="clip0_4078_1148">
        <Path fill="#fff" d="M0 0h16v16H0z"></Path>
      </ClipPath>
    </Defs>
  </Svg>
);

export const shieldCheck = (props: IconProps) => (
  <Svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
);

export const send = (props: IconProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M4.06035 4.78213C3.71555 3.61266 4.94198 2.59649 6.02715 3.16006L6.02617 3.16104L20.1287 10.4823L20.1297 10.4833C21.1239 11.0009 21.124 12.4237 20.1297 12.9413C20.1271 12.9426 20.1235 12.9429 20.1209 12.9442L6.02617 20.2626L6.02715 20.2636C4.9444 20.8262 3.71119 19.8133 4.06035 18.6396L5.89043 12.4638H12.2986L12.3748 12.4599C12.753 12.4215 13.0486 12.1021 13.0486 11.7138C13.0486 11.3254 12.753 11.006 12.3748 10.9677L12.2986 10.9638H5.89141L4.06035 4.78213Z"
      fill="currentColor"
    />
  </Svg>
);

export const sendOutline = (props: IconProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M12.5136 12H6.65625"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.6301 12.6107L5.3408 20.5494C4.80213 20.8294 4.19013 20.3254 4.36346 19.7427L6.65813 12L4.36346 4.25736C4.19146 3.67469 4.80213 3.17069 5.3408 3.45069L20.6288 11.3894C21.1235 11.6467 21.1235 12.3547 20.6288 12.612L20.6301 12.6107Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const stop = (props: IconProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
  </Svg>
);

export const settings = (props: IconProps) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M10.0001 11.9433C11.074 11.9433 11.9446 11.0728 11.9446 9.99889C11.9446 8.925 11.074 8.05444 10.0001 8.05444C8.92622 8.05444 8.05566 8.925 8.05566 9.99889C8.05566 11.0728 8.92622 11.9433 10.0001 11.9433Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <Path
      d="M16.861 8.0867L15.8288 7.72226C15.7154 7.43226 15.5854 7.14448 15.4254 6.8667C15.2654 6.58893 15.081 6.33337 14.8866 6.09004L15.0866 5.01448C15.2254 4.26893 14.8788 3.51559 14.2221 3.1367L13.8321 2.91115C13.1743 2.53115 12.3499 2.60782 11.7732 3.10115L10.9454 3.80893C10.3232 3.71337 9.68656 3.71337 9.05322 3.80893L8.22545 3.10004C7.64878 2.6067 6.82323 2.53004 6.16656 2.91004L5.77656 3.13559C5.11878 3.51448 4.77322 4.26782 4.91211 5.01337L5.11211 6.08559C4.71211 6.58448 4.39434 7.1367 4.16545 7.72337L3.13878 8.08559C2.42322 8.33782 1.94434 9.01448 1.94434 9.77337V10.2234C1.94434 10.9823 2.42322 11.6589 3.13878 11.9111L4.171 12.2756C4.28434 12.5656 4.41323 12.8523 4.57434 13.13C4.73545 13.4078 4.91878 13.6634 5.11323 13.9078L4.91211 14.9834C4.77322 15.7289 5.11989 16.4823 5.77656 16.8611L6.16656 17.0867C6.82434 17.4667 7.64878 17.39 8.22545 16.8967L9.05322 16.1878C9.67434 16.2834 10.311 16.2834 10.9432 16.1878L11.7721 16.8978C12.3488 17.3911 13.1743 17.4678 13.831 17.0878L14.221 16.8623C14.8788 16.4823 15.2243 15.73 15.0854 14.9845L14.8854 13.9111C15.2843 13.4123 15.6032 12.8611 15.831 12.2745L16.8588 11.9123C17.5743 11.66 18.0532 10.9834 18.0532 10.2245V9.77448C18.0532 9.01559 17.5743 8.33893 16.8588 8.0867H16.861Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </Svg>
);

export const settingsActive = (props: IconProps) => (
  <Svg width="18" height="16" viewBox="0 0 18 16" fill="none" {...props}>
    <Path
      d="M5.16699 0.910219C5.82362 0.530239 6.64892 0.606409 7.22559 1.09967L8.05371 1.80866C8.68684 1.71315 9.32328 1.71317 9.94531 1.80866L10.7734 1.10065C11.3501 0.6074 12.1743 0.531275 12.832 0.911195L13.2227 1.13678C13.8789 1.51567 14.2256 2.26847 14.0869 3.01373L13.8867 4.08991C14.0811 4.3332 14.2658 4.58854 14.4258 4.86627C14.5858 5.144 14.7158 5.4318 14.8291 5.72174L15.8613 6.086H15.8594C16.5748 6.33827 17.0537 7.01565 17.0537 7.77448V8.2237C17.0537 8.9825 16.5748 9.65988 15.8594 9.91217L14.8311 10.2745C14.6033 10.861 14.2846 11.4124 13.8857 11.9112L14.0859 12.9844C14.2247 13.7298 13.8793 14.4824 13.2217 14.8624L12.8311 15.088C12.1745 15.4677 11.349 15.3907 10.7725 14.8975L9.94336 14.1876C9.31126 14.2831 8.67471 14.2831 8.05371 14.1876L7.22559 14.8965C6.64893 15.3898 5.82472 15.466 5.16699 15.086L4.77637 14.8604C4.12016 14.4815 3.77347 13.7287 3.91211 12.9835L4.11328 11.9073C3.9189 11.6629 3.73528 11.4076 3.57422 11.1299C3.41311 10.8522 3.28423 10.5654 3.1709 10.2755L2.13867 9.9112C1.42323 9.65892 0.944336 8.98154 0.944336 8.22272V7.7735C0.944336 7.01469 1.42324 6.33731 2.13867 6.08502L3.16602 5.72272C3.39489 5.13621 3.7124 4.5838 4.1123 4.08502L3.91211 3.01276C3.7734 2.26736 4.11877 1.51368 4.77637 1.13483L5.16699 0.910219ZM9 5.30377C7.51211 5.30383 6.30592 6.51026 6.30566 7.99811C6.30566 9.48617 7.51195 10.6924 9 10.6924C10.488 10.6923 11.6943 9.48613 11.6943 7.99811C11.6941 6.51031 10.4878 5.30391 9 5.30377ZM9 6.80377C9.6594 6.80391 10.1941 7.33874 10.1943 7.99811C10.1943 8.6577 9.65956 9.19231 9 9.19245C8.34038 9.19239 7.80566 8.65775 7.80566 7.99811C7.80592 7.33869 8.34053 6.80383 9 6.80377Z"
      fill="currentColor"
    />
  </Svg>
);

export const unblock = (props: IconProps) => (
  <Svg width={16} height={17} viewBox="0 0 16 17" fill="none" {...props}>
    <Path
      d="M3.44263 13.0574L12.5493 3.95068"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.99999 14.9444C11.5592 14.9444 14.4444 12.0592 14.4444 8.49999C14.4444 4.94082 11.5592 2.05554 7.99999 2.05554C4.44082 2.05554 1.55554 4.94082 1.55554 8.49999C1.55554 12.0592 4.44082 14.9444 7.99999 14.9444Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const search = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M13.556 13.556 10.03 10.03M6.889 11.333a4.444 4.444 0 1 0 0-8.889 4.444 4.444 0 0 0 0 8.89"
    ></Path>
  </Svg>
);

export const travel = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <G
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      clipPath="url(#clip0_4201_245)"
    >
      <Path d="M11.143 4.857 9.538 8.603c-.18.42-.514.753-.934.933L4.86 11.141l1.605-3.745c.18-.42.514-.754.933-.934zM8 3.333V1.556M12.667 8h1.777M8 12.667v1.777M3.333 8H1.556"></Path>
      <Path d="M8 14.445a6.444 6.444 0 1 0 0-12.89 6.444 6.444 0 0 0 0 12.89"></Path>
    </G>
    <Defs>
      <ClipPath id="clip0_4201_245">
        <Path fill="#fff" d="M0 0h16v16H0z"></Path>
      </ClipPath>
    </Defs>
  </Svg>
);

export const save = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9.556 2v2.667a.89.89 0 0 1-.89.889h-3.11a.89.89 0 0 1-.89-.89V2M4.667 14V9.556a.89.89 0 0 1 .889-.89h4.889a.89.89 0 0 1 .888.89V14"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12.08 14H3.92A1.92 1.92 0 0 1 2 12.08V3.92C2 2.86 2.86 2 3.92 2h6.6c.236 0 .463.093.63.26l2.59 2.59c.167.168.26.394.26.63v6.6c0 1.06-.86 1.92-1.92 1.92"
    ></Path>
  </Svg>
);

export const star = (props: IconProps) => (
  <Svg width={16} height={17} viewBox="0 0 16 17" fill="none" {...props}>
    <Path
      d="M4.21606 2.71445L3.37517 2.43445L3.09428 1.59267C3.00362 1.32067 2.55295 1.32067 2.46228 1.59267L2.18139 2.43445L1.3405 2.71445C1.2045 2.75978 1.11206 2.88689 1.11206 3.03089C1.11206 3.17489 1.2045 3.30201 1.3405 3.34734L2.18139 3.62734L2.46228 4.46912C2.50762 4.60512 2.63473 4.69667 2.77784 4.69667C2.92095 4.69667 3.04895 4.60423 3.09339 4.46912L3.37428 3.62734L4.21517 3.34734C4.35117 3.30201 4.44362 3.17489 4.44362 3.03089C4.44362 2.88689 4.35206 2.75978 4.21606 2.71445Z"
      fill="currentColor"
    />
    <Path
      d="M11.9724 9.14624L14.4444 6.73647L9.9911 6.09024L7.99999 2.05469L6.00888 6.09024L1.55554 6.73647L4.77776 9.8778L4.01688 14.3125L7.8791 12.2822"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.4737 12.4915L12.3511 12.1173L11.9768 10.9947C11.8551 10.632 11.2551 10.632 11.1333 10.9947L10.7591 12.1173L9.6364 12.4915C9.45506 12.552 9.3324 12.7218 9.3324 12.9129C9.3324 13.104 9.45506 13.2738 9.6364 13.3342L10.7591 13.7084L11.1333 14.8311C11.1937 15.0124 11.3644 15.1351 11.5555 15.1351C11.7466 15.1351 11.9164 15.0124 11.9777 14.8311L12.352 13.7084L13.4746 13.3342C13.656 13.2738 13.7786 13.104 13.7786 12.9129C13.7786 12.7218 13.656 12.552 13.4746 12.4915H13.4737Z"
      fill="currentColor"
    />
    <Path
      d="M12.6667 4.05599C13.0349 4.05599 13.3333 3.75751 13.3333 3.38932C13.3333 3.02113 13.0349 2.72266 12.6667 2.72266C12.2985 2.72266 12 3.02113 12 3.38932C12 3.75751 12.2985 4.05599 12.6667 4.05599Z"
      fill="currentColor"
    />
  </Svg>
);

export const starUnmark = (props: IconProps) => (
  <Svg width={16} height={17} viewBox="0 0 16 17" fill="none" {...props}>
    <Path
      d="M4.39643 12.1035L4.77776 9.87865L1.55554 6.73732L6.00888 6.09021L7.99999 2.05554L9.9911 6.09021L10.3564 6.14354"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.1004 6.54272L14.4444 6.73739L11.2222 9.87872L11.9831 14.3134L7.99997 12.2201L6.78308 12.8601"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1.77777 14.7223L14.2222 2.27783"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const snapchat = (props: IconProps) => (
  <Svg
    width="24"
    height="22"
    viewBox="0 0 24 22"
    fill="currentColor"
    {...props}
  >
    <Path
      d="M23.7437 17.8957C23.011 18.5706 21.9617 18.6393 21.0359 18.7C20.4456 18.7387 19.8352 18.7787 19.4784 18.9714C19.1341 19.1574 18.7792 19.635 18.4359 20.0967C17.8836 20.8397 17.2576 21.6818 16.2664 21.9307C15.3106 22.1709 14.368 21.7396 13.5362 21.3591C12.9905 21.1095 12.4261 20.8514 12.0008 20.8514C11.5755 20.8514 11.0112 21.1095 10.4655 21.3591C9.80036 21.6632 9.06418 21.9999 8.30735 21.9999C8.11447 22.0005 7.92228 21.9772 7.73533 21.9307C6.74406 21.6818 6.11807 20.8397 5.5657 20.0966C5.22242 19.635 4.86747 19.1574 4.52326 18.9714C4.16646 18.7787 3.55603 18.7387 2.96575 18.7C2.03998 18.6393 0.990706 18.5706 0.257971 17.8957C0.160637 17.8061 0.0871613 17.6944 0.0439673 17.5705C0.000773197 17.4465 -0.010824 17.3141 0.0101897 17.1847C0.0312035 17.0554 0.0841883 16.933 0.164512 16.8284C0.244835 16.7238 0.350052 16.6401 0.470962 16.5846C0.498696 16.5715 1.744 15.9746 2.96825 14.447C3.74889 13.4628 4.34872 12.3527 4.74079 11.1663L2.70778 10.3684C2.50664 10.2893 2.34573 10.1351 2.26041 9.93965C2.1751 9.7442 2.17237 9.5235 2.25283 9.32608C2.33329 9.12866 2.49035 8.97067 2.68948 8.88686C2.88861 8.80305 3.1135 8.80027 3.31472 8.87913L5.15883 9.60299C5.36611 8.55291 5.46797 7.48542 5.46295 6.41583C5.46295 4.71424 6.15176 3.08235 7.37784 1.87915C8.60393 0.675951 10.2669 0 12.0008 0C13.7348 0 15.3977 0.675951 16.6238 1.87915C17.8499 3.08235 18.5387 4.71424 18.5387 6.41583C18.5337 7.48542 18.6355 8.55291 18.8428 9.60299L20.6869 8.87914C20.8879 8.80101 21.1123 8.80427 21.3109 8.8882C21.5096 8.97214 21.6662 9.1299 21.7465 9.32693C21.8268 9.52396 21.8243 9.7442 21.7394 9.9394C21.6546 10.1346 21.4944 10.2889 21.2939 10.3684L19.2609 11.1664C19.6529 12.3527 20.2528 13.4629 21.0334 14.447C22.2654 15.9842 23.5186 16.5789 23.5311 16.5848C23.6516 16.6407 23.7563 16.7246 23.8362 16.8293C23.9162 16.9339 23.9689 17.0561 23.9898 17.1852C24.0108 17.3143 23.9993 17.4466 23.9564 17.5704C23.9135 17.6942 23.8405 17.8059 23.7437 17.8957H23.7437Z"
      fill="currentColor"
    />
  </Svg>
);

export const tiktok = (props: IconProps) => (
  <Svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    {...props}
  >
    <Path
      d="M12.8822 3.70813C12.781 3.6558 12.6824 3.59843 12.5869 3.53625C12.3092 3.35264 12.0545 3.1363 11.8285 2.89188C11.2628 2.24469 11.0516 1.58812 10.9738 1.12844H10.9769C10.9119 0.746875 10.9388 0.5 10.9428 0.5H8.3666V10.4619C8.3666 10.5956 8.3666 10.7278 8.36097 10.8584C8.36097 10.8747 8.35941 10.8897 8.35847 10.9072C8.35847 10.9144 8.35847 10.9219 8.35691 10.9294C8.35691 10.9312 8.35691 10.9331 8.35691 10.935C8.32975 11.2924 8.21518 11.6377 8.02326 11.9405C7.83134 12.2432 7.56796 12.4942 7.25629 12.6713C6.93146 12.856 6.56406 12.953 6.19035 12.9525C4.99004 12.9525 4.01722 11.9738 4.01722 10.765C4.01722 9.55625 4.99004 8.5775 6.19035 8.5775C6.41756 8.57729 6.64338 8.61304 6.85941 8.68344L6.86253 6.06031C6.20671 5.9756 5.54045 6.02772 4.90578 6.21339C4.2711 6.39906 3.6818 6.71424 3.17503 7.13906C2.73099 7.52488 2.35768 7.98522 2.07191 8.49938C1.96316 8.68688 1.55285 9.44031 1.50316 10.6631C1.47191 11.3572 1.68035 12.0763 1.77972 12.3734V12.3797C1.84222 12.5547 2.08441 13.1519 2.4791 13.6553C2.79736 14.0591 3.17337 14.4139 3.59503 14.7081V14.7019L3.60128 14.7081C4.84847 15.5556 6.23129 15.5 6.23129 15.5C6.47066 15.4903 7.27254 15.5 8.18316 15.0684C9.19316 14.59 9.76816 13.8772 9.76816 13.8772C10.1355 13.4513 10.4276 12.9659 10.6319 12.4419C10.865 11.8291 10.9428 11.0941 10.9428 10.8003V5.51531C10.9741 5.53406 11.3903 5.80937 11.3903 5.80937C11.3903 5.80937 11.99 6.19375 12.9257 6.44406C13.5969 6.62219 14.5013 6.65969 14.5013 6.65969V4.10219C14.1844 4.13656 13.541 4.03656 12.8822 3.70813Z"
      fill="currentColor"
    />
  </Svg>
);

export const twitter = ({ color = "currentColor", ...props }: IconProps) => (
  <Svg viewBox="0 0 512 512" {...props}>
    <Path
      d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"
      fill={color}
    />
  </Svg>
);

export const sidebarRight = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M9.75 2.75v12.5M14.25 2.75H3.75a2 2 0 0 0-2 2v8.5a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2v-8.5a2 2 0 0 0-2-2M13.75 6.25h-1.5M13.75 9h-1.5M13.75 11.75h-1.5"
    ></Path>
  </Svg>
);

export const smile = (props: IconProps) => (
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
      d="M12.749 11A4.25 4.25 0 0 1 9 13.25 4.25 4.25 0 0 1 5.251 11"
    ></Path>
    <Path
      fill="currentColor"
      d="M7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2M11 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
    ></Path>
  </Svg>
);

export const twitch = (props: IconProps) => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <Path
      d="M2.5 1L1.5 3.5V13H4.5V15H6.5L8.5 13H11L14.5 9.5V1H2.5ZM13 9L11 11H8L6 13V11H3.5V2.5H13V9Z"
      fill="currentColor"
    />
    <Path d="M11.5 4.46875H10V8.5H11.5V4.46875Z" fill="currentColor" />
    <Path d="M8 4.46875H6.5V8.5H8V4.46875Z" fill="currentColor" />
  </Svg>
);

export const slides = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M13.25 5.25h3M1.75 5.25h7M11 7.5A2.25 2.25 0 1 0 11 3a2.25 2.25 0 0 0 0 4.5M4.75 12.75h-3M16.25 12.75h-7M7 15a2.25 2.25 0 1 0 0-4.5A2.25 2.25 0 0 0 7 15"
    ></Path>
  </Svg>
);

export const trash = (props: IconProps) => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <Path
      d="M13.1109 5.55554V11.7778C13.1109 12.76 12.3153 13.5555 11.3331 13.5555H4.66645C3.68423 13.5555 2.88867 12.76 2.88867 11.7778V5.55554"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.5557 2.44446H2.44455C1.95363 2.44446 1.55566 2.84243 1.55566 3.33335V4.66668C1.55566 5.1576 1.95363 5.55557 2.44455 5.55557H13.5557C14.0466 5.55557 14.4446 5.1576 14.4446 4.66668V3.33335C14.4446 2.84243 14.0466 2.44446 13.5557 2.44446Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6.22266 8.22223H9.77821"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const shareRight = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M14.25 10.75v2.5a2 2 0 0 1-2 2h-7.5a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 2-2h3.5M13 1.75 16.25 5 13 8.25"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M16 5h-3.25a4 4 0 0 0-4 4"
    ></Path>
  </Svg>
);

export const strikethrough = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M12.999 11.336c.09.274.145.579.153.919.05 2.076-1.817 3.495-4.074 3.495-2.157 0-3.655-.84-4.234-2.736M12.775 4.626C11.956 2.689 10.32 2.25 9.08 2.25c-1.152 0-4.174.612-3.894 3.515.196 2.037 2.117 2.796 3.794 3.095q.333.058.694.139M2 9h14"
    ></Path>
  </Svg>
);

export const undo = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M3 10c.528-.461 2.7-2.251 6-2.251s5.472 1.79 6 2.251"
    ></Path>
    <Path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M4.625 5.598 3 10l4.53 1.222"
    ></Path>
  </Svg>
);

export const tableRows = (props: IconProps) => (
  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
    <Path
      d="M1.94434 7.5H18.0554"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1.94434 12.5H18.0554"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.8332 3.05554H4.16656C2.93926 3.05554 1.94434 4.05046 1.94434 5.27776V14.7222C1.94434 15.9495 2.93926 16.9444 4.16656 16.9444H15.8332C17.0605 16.9444 18.0554 15.9495 18.0554 14.7222V5.27776C18.0554 4.05046 17.0605 3.05554 15.8332 3.05554Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const tag = (props: IconProps) => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <Path
      d="M2.88889 2H7.264C7.73511 2 8.18756 2.18756 8.52089 2.52089L13.632 7.632C14.3262 8.32622 14.3262 9.45156 13.632 10.1458L10.1458 13.632C9.45156 14.3262 8.32622 14.3262 7.632 13.632L2.52089 8.52089C2.18756 8.18756 2 7.73511 2 7.264V2.88889C2 2.39822 2.39822 2 2.88889 2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.55545 6.66668C6.1691 6.66668 6.66656 6.16922 6.66656 5.55557C6.66656 4.94192 6.1691 4.44446 5.55545 4.44446C4.9418 4.44446 4.44434 4.94192 4.44434 5.55557C4.44434 6.16922 4.9418 6.66668 5.55545 6.66668Z"
      fill="currentColor"
    />
  </Svg>
);

export const userList = (props: IconProps) => (
  <Svg width={19} height={19} viewBox="0 0 19 19" fill="none" {...props}>
    <Path
      d="M7.42419 7.78516C8.66684 7.78516 9.67419 6.7778 9.67419 5.53516C9.67419 4.29252 8.66684 3.28516 7.42419 3.28516C6.18155 3.28516 5.17419 4.29252 5.17419 5.53516C5.17419 6.7778 6.18155 7.78516 7.42419 7.78516Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.4652 15.3512C12.3022 15.0602 12.7312 14.0942 12.3312 13.3032C11.4252 11.5122 9.57023 10.2832 7.42523 10.2832C5.28023 10.2832 3.42523 11.5112 2.51923 13.3032C2.11923 14.0942 2.54723 15.0602 3.38523 15.3512C4.41623 15.7092 5.79323 16.0342 7.42523 16.0342C9.05723 16.0342 10.4342 15.7092 11.4652 15.3512Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.8672 3.78516H12.3672"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.8672 7.28516H12.3672"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.8672 10.7852H14.1172"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const undoCircle = (props: IconProps) => (
  <Svg width="18" height="18" fill="none" viewBox="0 0 18 18" {...props}>
    <Path
      fill="#000"
      d="M9 17a8 8 0 0 1-6.62-3.508.75.75 0 1 1 1.241-.843 6.5 6.5 0 0 0 5.38 2.851c3.584 0 6.5-2.916 6.5-6.5s-2.916-6.5-6.5-6.5a6.5 6.5 0 0 0-5.959 3.9.751.751 0 0 1-1.375-.601A8 8 0 0 1 9 1c4.411 0 8 3.589 8 8s-3.589 8-8 8"
    ></Path>
    <Path
      fill="#000"
      d="M2.287 7a.75.75 0 0 1-.742-.647l-.408-2.945a.75.75 0 1 1 1.486-.206l.305 2.202 2.201-.305a.75.75 0 0 1 .205 1.487l-2.944.407A1 1 0 0 1 2.287 7"
    ></Path>
  </Svg>
);

export const share = (props: IconProps) => (
  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
    <Path
      d="M12.6666 9.55554V11.7778C12.6666 12.76 11.871 13.5555 10.8888 13.5555H4.22211C3.23989 13.5555 2.44434 12.76 2.44434 11.7778V5.11109C2.44434 4.12887 3.23989 3.33331 4.22211 3.33331H7.33322"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.5557 1.55554L14.4446 4.44443L11.5557 7.33332"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.2223 4.44446H11.3334C9.36983 4.44446 7.77783 6.03646 7.77783 8.00001"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const screenShare = (props: IconProps) => (
  <Svg width="29" height="29" viewBox="0 0 29 29" fill="none" {...props}>
    <G clipPath="url(#clip0_13450_297506)">
      <Path
        d="M27.5832 2.84417C27.2192 2.63729 26.7666 2.64351 26.4103 2.86129L23.1094 4.83995C22.8761 4.97995 22.7314 5.23351 22.7314 5.50728V7.06284C22.7314 7.33662 22.8746 7.59017 23.1094 7.73017L26.4088 9.70728C26.5939 9.81928 26.8023 9.87529 27.0108 9.87529C27.2083 9.87529 27.4059 9.82551 27.5832 9.7244C27.9488 9.51751 28.1759 9.12862 28.1759 8.70862V3.85995C28.1759 3.4384 27.9488 3.04951 27.5832 2.84417Z"
        fill="currentColor"
      />
      <Path
        d="M9.12012 26.1176C10.2992 25.7458 12.0415 25.3398 14.1757 25.3398C15.4123 25.3398 17.195 25.4767 19.2312 26.1176"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.1758 21.4512V25.3401"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M25.4535 12.2712V18.3394C25.4535 20.0583 24.0613 21.4505 22.3424 21.4505H6.00906C4.29017 21.4505 2.89795 20.0583 2.89795 18.3394V8.2283C2.89795 6.50941 4.29017 5.11719 6.00906 5.11719H9.89795"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20.3982 2.00586H16.5093C15.0059 2.00586 13.7871 3.22464 13.7871 4.72808V7.83919C13.7871 9.34263 15.0059 10.5614 16.5093 10.5614H20.3982C21.9017 10.5614 23.1204 9.34263 23.1204 7.83919V4.72808C23.1204 3.22464 21.9017 2.00586 20.3982 2.00586Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_13450_297506">
        <Rect
          width="28"
          height="28"
          fill="white"
          transform="translate(0.175781 0.839844)"
        />
      </ClipPath>
    </Defs>
  </Svg>
);

export const stopScreenShare = (props: IconProps) => (
  <Svg width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
    <Path
      d="M4.75 13.25H3.75C2.645 13.25 1.75 12.355 1.75 11.25V10"
      stroke="#FCFCFC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.25 5V11.25C16.25 12.355 15.355 13.25 14.25 13.25H8"
      stroke="#FCFCFC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 2.75H15.25"
      stroke="#FCFCFC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.75 16.25C6.508 16.011 7.628 15.75 9 15.75C9.795 15.75 10.941 15.838 12.25 16.25"
      stroke="#FCFCFC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 13.25V15.75"
      stroke="#FCFCFC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 16L16 2"
      stroke="#FCFCFC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M1.75 7.25V2.75H6.25"
      stroke="#FCFCFC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 3L6.5 7.5"
      stroke="#FCFCFC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

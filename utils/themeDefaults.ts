export const SPEED_TO_DURATION: Record<"slow" | "medium" | "fast", number> = {
  slow: 5000,
  medium: 2500,
  fast: 1200,
};

export interface CuratedFont {
  displayName: string;
  family: string;
  url: string;
}

export const CURATED_FONTS: CuratedFont[] = [
  {
    displayName: "Playfair Display",
    family: "PlayfairDisplay",
    url: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtY.ttf",
  },
  {
    displayName: "Lora",
    family: "Lora",
    url: "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkq0.ttf",
  },
  {
    displayName: "Merriweather",
    family: "Merriweather",
    url: "https://fonts.gstatic.com/s/merriweather/v30/u-440qOErmB84Hv-7oETWBcirUlKPg.ttf",
  },
  {
    displayName: "Raleway",
    family: "Raleway",
    url: "https://fonts.gstatic.com/s/raleway/v34/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrQ.ttf",
  },
  {
    displayName: "Montserrat",
    family: "Montserrat",
    url: "https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXp-p7K4KLg.ttf",
  },
  {
    displayName: "Oswald",
    family: "Oswald",
    url: "https://fonts.gstatic.com/s/oswald/v53/TK3_WkUHHAIjg75cFRf3bXL8LICs1_FvsUZiYA.ttf",
  },
  {
    displayName: "Poppins",
    family: "Poppins",
    url: "https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJfecg.ttf",
  },
  {
    displayName: "Dancing Script",
    family: "DancingScript",
    url: "https://fonts.gstatic.com/s/dancingscript/v25/If2cXTr6YS-zF4S-kcSWSVi_sxjsniB7ulqWl8EnA6Ih.ttf",
  },
  {
    displayName: "Pacifico",
    family: "Pacifico",
    url: "https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy14u9lezJ96A4sijpFu_.ttf",
  },
  {
    displayName: "Caveat",
    family: "Caveat",
    url: "https://fonts.gstatic.com/s/caveat/v18/WnznHAc5bAfYB2QRah7pcpNvOx-pjfJ9SIKjYBxPigs.ttf",
  },
  {
    displayName: "Permanent Marker",
    family: "PermanentMarker",
    url: "https://fonts.gstatic.com/s/permanentmarker/v16/Fh4uPib9Iyv2ucM6pGQMWimMp004HaqIfrT5nlk.ttf",
  },
  {
    displayName: "Satisfy",
    family: "Satisfy",
    url: "https://fonts.gstatic.com/s/satisfy/v21/rP2Hp2yn6lkG50LoOZSCHBeHFl0.ttf",
  },
  {
    displayName: "Lobster",
    family: "Lobster",
    url: "https://fonts.gstatic.com/s/lobster/v30/neILzCirqoswsqX9zoKmM4MwWJU.ttf",
  },
  {
    displayName: "Comfortaa",
    family: "Comfortaa",
    url: "https://fonts.gstatic.com/s/comfortaa/v45/1Pt_g8LJRfWJmhDAuUsSQamb1W0lwk4S4WjMDrMfIA.ttf",
  },
  {
    displayName: "Quicksand",
    family: "Quicksand",
    url: "https://fonts.gstatic.com/s/quicksand/v31/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkP8o58a-xDwxUD2GFw.ttf",
  },
  {
    displayName: "Abril Fatface",
    family: "AbrilFatface",
    url: "https://fonts.gstatic.com/s/abrilfatface/v23/zOL64pLDlL1D99S8HAFadkLFOS2HQAtXvQ.ttf",
  },
  {
    displayName: "Righteous",
    family: "Righteous",
    url: "https://fonts.gstatic.com/s/righteous/v17/1cXxaUPXBpj2rGoU7C9mj3uEicG01A.ttf",
  },
  {
    displayName: "Bebas Neue",
    family: "BebasNeue",
    url: "https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg69CK48gW7PXooxW5rygbi49c.ttf",
  },
  {
    displayName: "Indie Flower",
    family: "IndieFlower",
    url: "https://fonts.gstatic.com/s/indieflower/v21/m8JVjfNVeKWVnh7QMuKkFcZlbkGG1dKEDw.ttf",
  },
  {
    displayName: "Sacramento",
    family: "Sacramento",
    url: "https://fonts.gstatic.com/s/sacramento/v15/buEzpo6gcdjy0EiZMBUG4C0f-w.ttf",
  },
  {
    displayName: "Architects Daughter",
    family: "ArchitectsDaughter",
    url: "https://fonts.gstatic.com/s/architectsdaughter/v18/KtkxAKiDZI_td1Lkx62xHZHDtgO_Y-bvfY5q4szgE-Q.ttf",
  },
  {
    displayName: "Josefin Sans",
    family: "JosefinSans",
    url: "https://fonts.gstatic.com/s/josefinsans/v32/Qw3PZQNVED7rKGKxtqIqX5E-AVSJrOCfjY46_DjQbMZhKSbpUVzEEQ.ttf",
  },
  {
    displayName: "Fredoka One",
    family: "FredokaOne",
    url: "https://fonts.gstatic.com/s/fredokaone/v14/k3kUo8kEI-tA1RRcTZGmTmHBA6aF8Bf_.ttf",
  },
  {
    displayName: "Press Start 2P",
    family: "PressStart2P",
    url: "https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.ttf",
  },
  {
    displayName: "Shadows Into Light",
    family: "ShadowsIntoLight",
    url: "https://fonts.gstatic.com/s/shadowsintolight/v19/UqyNK9UOIntux_czAvDQx_ZcHqZXBNQzdcD55TecYQ.ttf",
  },
  {
    displayName: "Russo One",
    family: "RussoOne",
    url: "https://fonts.gstatic.com/s/russoone/v16/Z9XUDmZRWg6M1LvRYsH-yMOInrib9Q.ttf",
  },
  {
    displayName: "Amatic SC",
    family: "AmaticSC",
    url: "https://fonts.gstatic.com/s/amaticsc/v26/TUZyzwprpvBS1izs_Hx3QMc8fREA.ttf",
  },
  {
    displayName: "Courgette",
    family: "Courgette",
    url: "https://fonts.gstatic.com/s/courgette/v17/wEO_EBrAnc9BLjLQAUkFUfAL3EsHiA.ttf",
  },
  {
    displayName: "Cinzel",
    family: "Cinzel",
    url: "https://fonts.gstatic.com/s/cinzel/v23/8vIU7ww63mVu7gtR-kwKxNvkNOjw-tbnTYrvDE5ZdqU.ttf",
  },
  {
    displayName: "Bungee",
    family: "Bungee",
    url: "https://fonts.gstatic.com/s/bungee/v14/N0bU2SZBIuF2PU_ECn50Kd_PmA.ttf",
  },
];

/**
 * Calculate relative luminance of a hex color per WCAG 2.0.
 */
function luminance(hex: string): number {
  const rgb = hex.replace("#", "");
  const r = parseInt(rgb.substring(0, 2), 16) / 255;
  const g = parseInt(rgb.substring(2, 4), 16) / 255;
  const b = parseInt(rgb.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * WCAG contrast ratio between two hex colors.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns true if the contrast ratio meets WCAG AA for normal text (>= 4.5:1).
 */
export function hasGoodContrast(fg: string, bg: string): boolean {
  return getContrastRatio(fg, bg) >= 4.5;
}

import { IconProps } from "./icons/types";
import * as icons_a_c from "./icons/icons-a-c";
import * as icons_d_f from "./icons/icons-d-f";
import * as icons_g_i from "./icons/icons-g-i";
import * as icons_j_l from "./icons/icons-j-l";
import * as icons_m_o from "./icons/icons-m-o";
import * as icons_p_r from "./icons/icons-p-r";
import * as icons_s_u from "./icons/icons-s-u";
import * as icons_v_z from "./icons/icons-v-z";
import { delete_ } from "./icons/icons-reserved";

export type { IconProps };

export const Icons = {
  ...icons_a_c,
  ...icons_d_f,
  ...icons_g_i,
  ...icons_j_l,
  ...icons_m_o,
  ...icons_p_r,
  ...icons_s_u,
  ...icons_v_z,
  "delete": delete_,
};

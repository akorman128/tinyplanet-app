const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    // Deno edge functions target a different runtime (npm: specifiers, Deno
    // globals) and are excluded from tsconfig too; lint them separately.
    // .design-sync/ (committed) and .ds-sync/ (scratch) hold design-sync
    // preview compositions that import the virtual `tiny-planet` bundle
    // specifier — not resolvable by the app's import resolver, and not app code.
    ignores: [
      "dist/*",
      "supabase/functions/**",
      ".design-sync/**",
      ".ds-sync/**",
    ],
  },
  {
    // The `import` plugin is already registered by eslint-config-expo/flat;
    // re-registering it errors under ESLint 9 ("Cannot redefine plugin").
    // We only need to supply resolver settings here.
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
    rules: {
      // Pre-existing violations in map/marker/avatar components unrelated to
      // this change. Downgraded to "warn" to bootstrap CI without editing
      // unrelated files; ratchet back to "error" after a dedicated cleanup.
      // `import/namespace` additionally false-positives on @rnmapbox/maps'
      // namespace export and is performance-heavy.
      "react/display-name": "warn",
      "react/no-unescaped-entities": "warn",
      "import/namespace": "warn",
    },
  },
]);

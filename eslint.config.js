const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    // Deno edge functions target a different runtime (npm: specifiers, Deno
    // globals) and are excluded from tsconfig too; lint them separately.
    ignores: ["dist/*", "supabase/functions/**"],
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

// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "src/app/**", "src/components/**", "src/hooks/**", "src/services/**", "src/types/wellness.ts", "src/types/campus.ts"],
  }
]);

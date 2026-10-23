import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**", "node_modules/**", "prisma/migrations/**", "archive/**",
      "sgcl-web/**", "sgcl-portal-professor/**", "sgcl-portal-familia/**",
      "landing/**", "landing-academia/**",
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: { globals: globals.node },
    rules: {
      "no-undef": "off",
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_", ignoreRestSiblings: true }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["tests/load/**"],
    languageOptions: { globals: { __ENV: "readonly", __VU: "readonly", __ITER: "readonly", open: "readonly" } },
  },
  {
    files: ["scripts/**", "prisma/seeds/**", "src/shared/observability/logger.ts"],
    rules: { "no-console": "off" },
  },
  {
    files: ["src/shared/testing/**"],
    rules: { "no-console": "off" },
  },
);

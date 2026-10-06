import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

// Public PR lane: deliberately untyped, not the full community review.
export default [
  { ignores: ["node_modules/**", "vendor/**", "artifacts/**", "outputs/**", "dist/**", "test-vaults/**", "tests/**", "scripts/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    plugins: { obsidianmd },
    rules: {
      ...obsidianmd.ruleConfigs.recommended,
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "obsidianmd/ui/sentence-case": ["warn", { brands: ["Atlas", "Graph", "Obsidian", "See the Forest"], acronyms: ["README", "API"] }],
    },
  },
];

import obsidianmd from "eslint-plugin-obsidianmd";

// Actual typed community rules: only plugin code, never protected Atlas bytes.
export default [
  { ignores: ["node_modules/**", "vendor/**", "artifacts/**", "outputs/**", "dist/**", "test-vaults/**", "tests/**", "scripts/**"] },
  ...obsidianmd.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: { "obsidianmd/ui/sentence-case": ["warn", { brands: ["Atlas", "Graph", "Obsidian", "See the Forest"], acronyms: ["README", "API"] }] },
  },
];

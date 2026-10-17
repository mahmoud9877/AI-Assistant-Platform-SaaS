import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  { ignores: [".next/", "node_modules/", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "import/no-duplicates": "error",
      // Features talk to each other only through their index.ts (their public API).
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*"],
              message: "Import from the feature's public API (e.g. '@/features/chat'), not its internal files.",
            },
          ],
        },
      ],
    },
  },
  {
    // Shared code (UI kit, layout, hooks, lib) must not depend on any feature.
    files: ["components/**", "hooks/**", "lib/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/features/*"], message: "Shared code must not import from features." }] },
      ],
    },
  },
];

export default eslintConfig;

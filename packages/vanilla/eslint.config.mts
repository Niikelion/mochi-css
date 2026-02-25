import { defineConfig } from "eslint/config"
import * as js from "@eslint/js"
import * as tseslint from "typescript-eslint"
// @ts-ignore
import eslintConfigPrettier from "eslint-plugin-prettier/recommended"

export default defineConfig(
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    eslintConfigPrettier,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },
    {
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-import-type-side-effects": "error",
            "@typescript-eslint/consistent-type-definitions": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
        },
    },
    {
        ignores: ["dist/**", "coverage/**", "*.generated.ts"],
    },
)

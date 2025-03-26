import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";


export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { 
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], 
    languageOptions: { globals: globals.browser },
    rules: {
      "no-shadow": "error",                // Prevent shadowing variables
      "no-param-reassign": "error",        // Prevent modifying function parameters
      "require-await": "error",            // Force async functions to use await
      "max-depth": ["error", 3],           // Limit nesting depth
      "complexity": ["error", 10],         // Limit function complexity
      "react/prop-types": "error"          // Enforce PropTypes
    }
  },
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"] },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
]);
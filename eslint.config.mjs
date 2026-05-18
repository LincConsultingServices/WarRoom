import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [
      ".claude/**",
      ".next/**",
      "node_modules/**"
    ]
  },
  {
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/purity": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "react-hooks/set-state-in-effect": "off",
      "prefer-const": "warn",
      "@next/next/no-assign-module-variable": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-this-alias": "warn"
    }
  }
];

export default config;

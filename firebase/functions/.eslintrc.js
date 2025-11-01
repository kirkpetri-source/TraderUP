module.exports = {
  parserOptions: {
    project: "./tsconfig.json",
  },
  extends: ["eslint:recommended", "plugin:import/recommended", "plugin:jsdoc/recommended", "prettier"],
  plugins: ["prefer-arrow"],
  ignorePatterns: ["lib/**/*"],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "prefer-arrow/prefer-arrow-functions": "off",
    "jsdoc/require-param-description": "off",
    "jsdoc/require-returns-description": "off"
  }
};

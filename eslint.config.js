const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

/**
 * Las dos reglas propias del proyecto (CLAUDE.md):
 *  1. mia/no-hex-colors  — falla ante un hex literal fuera de tokens.ts
 *  2. mia/no-literal-jsx-text — falla ante texto literal en JSX
 * Además: no-console, y prohibición de any/@ts-ignore vía TS.
 */
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;

const miaPlugin = {
  rules: {
    "no-hex-colors": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Ningún color hex fuera de packages/ui/tokens.ts (CLAUDE.md)",
        },
        schema: [],
      },
      create(context) {
        const check = (node, value) => {
          if (typeof value === "string" && HEX_RE.test(value)) {
            context.report({
              node,
              message:
                "Color hex literal '{{value}}' — usa packages/ui/tokens.ts",
              data: { value },
            });
          }
        };
        return {
          Literal(node) {
            check(node, node.value);
          },
          TemplateElement(node) {
            check(node, node.value && node.value.raw);
          },
        };
      },
    },
    "no-literal-jsx-text": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Nada de texto literal en JSX: todo pasa por t('clave') (CLAUDE.md)",
        },
        schema: [],
      },
      create(context) {
        return {
          JSXText(node) {
            if (node.value.trim().length > 0) {
              context.report({
                node,
                message:
                  "Texto literal en JSX ('{{text}}') — usa t('clave') con entrada en es.json y en.json",
                data: { text: node.value.trim().slice(0, 30) },
              });
            }
          },
        };
      },
    },
  },
};

module.exports = defineConfig([
  expoConfig,
  { ignores: ["dist/*", "node_modules/*", ".expo/*", "functions/**"] },
  {
    plugins: { mia: miaPlugin },
    rules: {
      "no-console": "error",
    },
  },
  {
    files: ["app/**/*.{ts,tsx}", "packages/ui/**/*.{ts,tsx}"],
    ignores: ["packages/ui/tokens.ts"],
    rules: {
      "mia/no-hex-colors": "error",
    },
  },
  {
    files: ["**/*.tsx"],
    rules: {
      "mia/no-literal-jsx-text": "error",
    },
  },
  {
    files: ["seed/**/*.ts", "scripts/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["packages/i18n/index.ts"],
    rules: {
      "import/no-named-as-default-member": "off",
    },
  },
]);

import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "https://sylview.e-chan.me/api/graphql",
  documents: ["entrypoints/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
  generates: {
    "./types/__generated__/": {
      preset: "client",
      config: {
        useTypeImports: true
      },
      plugins: []
    }
  }
};

export default config;

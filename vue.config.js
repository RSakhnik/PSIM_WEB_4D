const { defineConfig } = require("@vue/cli-service");

const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const CopyPlugin = require("copy-webpack-plugin");

const isProduction = process.env.NODE_ENV === "production";

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: "auto",
  outputDir: isProduction ? "./dist/frontend" : undefined,
  configureWebpack: () => {
    return {
      entry: {
        main: './src/main.ts',
        web3d: './src/app/web3d.component.extension.ts',
      },
      output: {
        uniqueName: "vue_ext",
        scriptType: "text/javascript",
        filename: "[name].js",
        clean: true,
      },
      optimization: {
        // fix a temporary bug
        runtimeChunk: false,
        splitChunks: isProduction ? undefined : false,
      },
      plugins: [
        new ModuleFederationPlugin({
          name: "vue_ext",
          library: {
            type: "var",
            name: "vue_ext",
          },
          filename: "[name].js",
          exposes: {
            "IInitializable": "./src/bimExtension.ts",
          },
          shared: {
            "@pilotdev/pilot-web-sdk": { singleton: true },
            "@pilotdev/pilot-web-3d": { singleton: true},
            "@supabase/supabase-js": { singleton: true},
          },
        }),
        new CopyPlugin({
          patterns: [
            {
              from: "./src/extension/extensions.config.json",
              to: `extensions.config.json`,
            },
          ],
        }),
      ],
      devServer: {
      port: 4300, // Явно указываем порт
    headers: {
      'Access-Control-Allow-Origin': '*', // Разрешаем CORS
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    },
    proxy: {
      // Настройка для всех запросов, начинающихся с '/extensions.config.json'
      '/extensions.config.json': {
        target: 'http://localhost:4300', // Куда перенаправлять запрос
        changeOrigin: true,              // Важно: меняет заголовок Origin на целевой
        secure: false                    // Разрешить перенаправление на HTTP (localhost)
      }
    }
  },
    };
  },
});
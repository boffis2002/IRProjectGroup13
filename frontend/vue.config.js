const { defineConfig } = require('@vue/cli-service')

module.exports = {
  devServer: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", 
        changeOrigin: true, 
      },
    },
  },
  configureWebpack: {
    plugins: [
      new (require('webpack')).DefinePlugin({
        "__VUE_PROD_HYDRATION_MISMATCH_DETAILS__": JSON.stringify(false), 
      }),
    ],
  },
};

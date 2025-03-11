module.exports = {
    lintOnSave: false,
    chainWebpack: config => {
      config.resolve.extensions
        .add('.js')
        .add('.vue')
        .add('.json')
    }
  }
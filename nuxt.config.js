export default {
  mode: 'universal',
  target: 'server',
  head: {
    title: 'London COVID-19 Cases',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // {
      //   hid: 'description',
      //   name: 'description',
      //   content: process.env.npm_package_description || '',
      // },
    ],
    link: [
      {
        rel: 'stylesheet',
        href:
          'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap',
      },
    ],
  },
  css: [],
  plugins: ['~/plugins/vtooltip'],
  components: true,
  buildModules: [
    '@nuxtjs/eslint-module',
    // ['@nuxtjs/vuetify', { treeShake: true }],
  ],
  modules: ['@nuxt/http', 'portal-vue/nuxt'],
}

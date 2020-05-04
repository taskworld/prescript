module.exports = {
  title: 'prescript',
  description: 'an end-to-end test runner that sparks joy',
  base: '/prescript/',

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'GitHub', link: 'https://github.com/taskworld/prescript' }
    ],
    sidebar: [
      {
        title: 'User guide',
        collapsable: false,
        children: [
          '/guide/',
          '/guide/tutorial.md',
          '/guide/writing-tests.md',
          '/guide/cli.md',
          '/guide/api.md',
          '/guide/config.md',
          '/guide/tips.md'
        ]
      },
      {
        title: 'More topics',
        collapsable: false,
        children: ['/guide/typings.md']
      }
    ]
  }
}

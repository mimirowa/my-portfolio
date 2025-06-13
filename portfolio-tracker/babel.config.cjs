module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: process.env.BABEL_ENV === 'test' ? 'commonjs' : false,
        targets: { node: 'current' }
      }
    ],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  plugins: ['babel-plugin-transform-import-meta']
};

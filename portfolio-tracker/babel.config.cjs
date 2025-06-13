module.exports = {
  presets: [
    ['@babel/preset-env', { modules: false, targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  plugins: ['babel-plugin-transform-import-meta']
};

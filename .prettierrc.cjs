module.exports = {
  plugins: [require('@trivago/prettier-plugin-sort-imports')],
  singleQuote: true,
  importOrder: ['^[./]'],
  importOrderSeparation: true,
};

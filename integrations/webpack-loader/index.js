const { parse } = require('tsn-parser');
const { getOptions } = require('loader-utils');

module.exports = function tsonLoader(source) {
  const options = getOptions(this) || {};
  
  try {
    const parsed = parse(source, options);
    return `module.exports = ${JSON.stringify(parsed)};`;
  } catch (error) {
    this.emitError(error);
    return 'module.exports = {};';
  }
};

module.exports.raw = false;
const { parse } = require('tsn-parser');
const { createFilter } = require('@rollup/pluginutils');

function tsonPlugin(options = {}) {
  const filter = createFilter(options.include || /\.tsn$/, options.exclude);
  
  return {
    name: 'tson',
    transform(code, id) {
      if (!filter(id)) return null;
      
      try {
        const parsed = parse(code, options);
        return {
          code: `export default ${JSON.stringify(parsed)};`,
          map: { mappings: '' }
        };
      } catch (error) {
        this.error(`Failed to parse TSON file ${id}: ${error.message}`);
      }
    }
  };
}

module.exports = tsonPlugin;
const { parse, stringify } = require('tsn-parser');

module.exports = {
  languages: [
    {
      name: 'TSON',
      parsers: ['tson'],
      extensions: ['.tsn', '.tson'],
      vscodeLanguageIds: ['tson']
    }
  ],
  parsers: {
    tson: {
      parse(text) {
        try {
          return parse(text);
        } catch (error) {
          throw new Error(`TSON parse error: ${error.message}`);
        }
      },
      astFormat: 'tson-ast'
    }
  },
  printers: {
    'tson-ast': {
      print(path, options) {
        const node = path.getValue();
        return stringify(node, {
          preserveFunctions: options.tsonPreserveFunctions || false
        });
      }
    }
  },
  options: {
    tsonPreserveFunctions: {
      type: 'boolean',
      default: false,
      description: 'Preserve function expressions in TSON output'
    }
  }
};
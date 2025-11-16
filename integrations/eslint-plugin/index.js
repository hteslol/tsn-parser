const { validate } = require('tsn-parser');

module.exports = {
  rules: {
    'valid-tson': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Validate TSON syntax',
          category: 'Possible Errors'
        },
        schema: []
      },
      create(context) {
        return {
          Program(node) {
            const sourceCode = context.getSourceCode();
            const text = sourceCode.getText();
            
            const result = validate(text);
            if (!result.valid) {
              context.report({
                node,
                message: `Invalid TSON syntax: ${result.error}`
              });
            }
          }
        };
      }
    }
  },
  configs: {
    recommended: {
      plugins: ['tson'],
      rules: {
        'tson/valid-tson': 'error'
      }
    }
  }
};
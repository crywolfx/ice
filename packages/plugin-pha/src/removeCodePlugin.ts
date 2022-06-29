import * as fs from 'fs';
import type { Plugin } from 'esbuild';
import { parse, type ParserOptions } from '@babel/parser';
import { default as traverse } from '@babel/traverse';
import { default as generate } from '@babel/generator';
import removeTopLevelCode from './removeTopLevelCode.js';

const removeCodePlugin = (): Plugin => {
  const parserOptions: ParserOptions = {
    sourceType: 'module',
    plugins: [
      'jsx',
      'importMeta',
      'topLevelAwait',
      'classProperties',
      'classPrivateMethods',
    ],
  };
  return {
    name: 'esbuild-remove-top-level-code',
    setup(build) {
      build.onLoad({ filter: /\.(js|jsx|ts|tsx)$/ }, async ({ path: id }) => {
        // TODO: read route file from route-manifest
        if (!id.includes('src/pages')) {
          return;
        }
        const source = fs.readFileSync(id, 'utf-8');
        let isTS = false;
        if (id.match(/\.(ts|tsx)$/)) {
          isTS = true;
          parserOptions.plugins.push('typescript', 'decorators-legacy');
        }
        const ast = parse(source, parserOptions);
        traverse(ast, removeTopLevelCode());
        const contents = generate(ast).code;
        return {
          contents,
          loader: isTS ? 'tsx' : 'jsx',
        };
      });
    },
  };
};

export default removeCodePlugin;

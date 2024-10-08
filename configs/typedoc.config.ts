import {baseTypedocConfig} from '@virmator/docs/configs/typedoc.config.base';
import {join, resolve} from 'node:path';
import type {TypeDocOptions} from 'typedoc';

const repoRoot = resolve(import.meta.dirname, '..');
const indexTsFile = join(repoRoot, 'src', 'index.ts');

export const typeDocConfig: Partial<TypeDocOptions> = {
    ...baseTypedocConfig,
    out: join(repoRoot, 'dist-docs'),
    entryPoints: [
        indexTsFile,
    ],
    intentionallyNotExported: [
        'andSymbol',
        'classSymbol',
        'enumSymbol',
        'exactSymbol',
        'indexedKeysSymbol',
        'orSymbol',
        'unknownSymbol',

        'BaseParts',
        'ExpandParts',
        'MaybeRequired',
        'OptionallyReadonly',
        'ShapeSpecifierType',
    ],
    defaultCategory: 'MISSING CATEGORY',
    categoryOrder: [
        'Main',
        'Shape Part',
        'Util',
        'Internal',
    ],
};

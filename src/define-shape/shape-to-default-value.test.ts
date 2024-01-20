import {itCases} from '@augment-vir/browser-testing';
import {exact, indexedKeys, unknownShape} from './shape-specifiers';
import {shapeToDefaultValue} from './shape-to-default-value';

describe(shapeToDefaultValue.name, () => {
    itCases(shapeToDefaultValue, [
        {
            it: 'allows defining a default value for unknown',
            inputs: [
                unknownShape('my default value'),
            ],
            expect: 'my default value',
        },
        {
            it: 'defaults unknown shape to empty object',
            inputs: [
                unknownShape(),
            ],
            expect: {},
        },
        {
            it: 'defaults indexed keys shape to empty object',
            inputs: [
                indexedKeys({
                    keys: exact('hi'),
                    values: {
                        hi: '',
                    },
                }),
            ],
            expect: {},
        },
    ]);
});

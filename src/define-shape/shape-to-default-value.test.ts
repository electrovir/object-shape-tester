import {itCases} from '@augment-vir/browser-testing';
import {unknownShape} from './shape-specifiers';
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
            it: 'unknown shape default to empty object',
            inputs: [
                unknownShape(),
            ],
            expect: {},
        },
    ]);
});

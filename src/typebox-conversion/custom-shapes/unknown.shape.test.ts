import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {assertValidShape} from '../check-shape.js';
import {unknownShape} from './unknown.shape.js';

describe(unknownShape.name, () => {
    it('has proper types', () => {
        const myUnknown = unknownShape('default');

        assert.tsType<typeof myUnknown.runtimeType>().equals<unknown>();
        assert.strictEquals(myUnknown.default, 'default');
    });

    itCases(
        (input: unknown) => assertValidShape(input, unknownShape()),
        [
            {
                it: 'accepts string',
                input: 'hi',
                throws: undefined,
            },
            {
                it: 'accepts object',
                input: {
                    hi: 'bye',
                },
                throws: undefined,
            },
            {
                it: 'accepts RegExp',
                input: /yo/,
                throws: undefined,
            },
        ],
    );
});

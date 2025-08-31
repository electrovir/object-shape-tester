import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {unknownShape} from './unknown.shape.js';

describe(unknownShape.name, () => {
    it('has proper types', () => {
        const myUnknown = unknownShape('default');

        assert.tsType<typeof myUnknown.runtimeType>().equals<unknown>();
        assert.strictEquals(myUnknown.default, 'default');
    });
    it('preserves provided default', () => {
        const myUnknown = unknownShape('hi');
        assert.strictEquals('hi', myUnknown.default as any);
    });
    it('defaults unknown without input to undefined', () => {
        const myUnknown = unknownShape();
        assert.strictEquals(undefined, myUnknown.default as any);
        assert.tsType<typeof myUnknown.runtimeType>().equals<unknown>();
    });
    it('optionally allows a single input', () => {
        /** Omitting inputs entirely is allowed. */
        unknownShape();
        unknownShape('single input is allowed');
        /** Any input is allowed. */
        unknownShape({});
        // @ts-expect-error: multiple inputs are not allowed
        unknownShape('multiple', 'are not allowed either');
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

import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {exactShape} from './exact.shape.js';

const mockSymbol = Symbol('mock symbol');

describe(exactShape.name, () => {
    it('has proper types', () => {
        const myExact = exactShape('t');

        assert.tsType<typeof myExact.runtimeType>().equals<'t'>();
        assert.strictEquals(myExact.default, 't');
    });

    it('requires only one input', () => {
        // @ts-expect-error: missing inputs
        exactShape();
        exactShape('one input is okay');
        // @ts-expect-error: multiple inputs are not okay
        exactShape('multiple', 'inputs', 'are not okay');
    });

    itCases(
        (input: unknown, exactOption: any) => assertValidShape(input, exactShape(exactOption)),
        [
            {
                it: 'accepts a const primitive',
                inputs: [
                    't',
                    't',
                ],
                throws: undefined,
            },
            {
                it: 'rejects a mismatched symbol',
                inputs: [
                    Symbol('different symbol'),
                    mockSymbol,
                ],
                throws: {
                    matchMessage: "Expected symbol 'mock symbol'",
                },
            },
            {
                it: 'rejects a mismatched symbol without a name',
                inputs: [
                    Symbol('different symbol'),
                    Symbol(),
                ],
                throws: {
                    matchMessage: 'Expected symbol <unnamed symbol>',
                },
            },
            {
                it: 'accepts a symbol',
                inputs: [
                    mockSymbol,
                    mockSymbol,
                ],
                throws: undefined,
            },
            {
                it: 'rejects a const primitive',
                inputs: [
                    'g',
                    't',
                ],
                throws: {
                    matchMessage: "Expected 't'",
                },
            },
            {
                it: 'accepts a const object',
                inputs: [
                    {
                        hello: 'there',
                    },
                    {
                        hello: 'there',
                    },
                ],
                throws: undefined,
            },
            {
                it: 'rejects a const object',
                inputs: [
                    {
                        hello: 'not there',
                    },
                    {
                        hello: 'there',
                    },
                ],
                throws: {
                    matchMessage: "Expected 'there'",
                },
            },
        ],
    );
});

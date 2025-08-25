import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {assertValidShape} from '../check-shape.js';
import {exactShape} from './exact.shape.js';

describe(exactShape.name, () => {
    it('has proper types', () => {
        const myExact = exactShape('t');

        assert.tsType<typeof myExact.runtimeType>().equals<'t'>();
        assert.strictEquals(myExact.default, 't');
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

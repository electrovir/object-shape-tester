import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {defineShape} from '../shape/shape.js';
import {exactShape} from './exact.shape.js';
import {tupleShape} from './tuple.shape.js';

describe(tupleShape.name, () => {
    it('has sensible default that matches its shape', () => {
        const myTuple = tupleShape('', -1, exactShape('hi'));

        assert.tsType<typeof myTuple.runtimeType>().equals<[string, number, 'hi']>();
        assert.deepEquals(myTuple.default, [
            '',
            -1,
            'hi',
        ]);
        assertValidShape(myTuple.default, myTuple);

        const wrapped = defineShape({
            value: tupleShape('', -1),
        });

        assert.tsType<typeof wrapped.runtimeType>().equals<{value: [string, number]}>();
        assert.deepEquals(wrapped.default, {
            value: [
                '',
                -1,
            ],
        });
        assertValidShape(wrapped.default, wrapped);
    });

    itCases(
        (input: unknown, tupleParts: ReadonlyArray<any>) =>
            assertValidShape(input, tupleShape(...tupleParts)),
        [
            {
                it: 'accepts a matching tuple',
                inputs: [
                    [
                        'hello',
                        42,
                        'hi',
                    ],
                    [
                        '',
                        -1,
                        exactShape('hi'),
                    ],
                ],
                throws: undefined,
            },
            {
                it: 'rejects wrong element type',
                inputs: [
                    [
                        'hello',
                        'not-a-number',
                        'hi',
                    ],
                    [
                        '',
                        -1,
                        exactShape('hi'),
                    ],
                ],
                throws: {
                    matchMessage: '/1: Expected number',
                },
            },
            {
                it: 'rejects wrong exact value',
                inputs: [
                    [
                        'hello',
                        42,
                        'bye',
                    ],
                    [
                        '',
                        -1,
                        exactShape('hi'),
                    ],
                ],
                throws: {
                    matchMessage: "/2: Expected 'hi'",
                },
            },
            {
                it: 'rejects non-array input',
                inputs: [
                    'not an array',
                    [
                        '',
                        -1,
                    ],
                ],
                throws: {
                    matchMessage: 'Expected tuple',
                },
            },
            {
                it: 'rejects incorrect tuple length',
                inputs: [
                    [
                        'only one',
                    ],
                    [
                        '',
                        -1,
                    ],
                ],
                throws: {
                    matchMessage: 'Expected tuple to have 2 elements',
                },
            },
        ],
    );
});

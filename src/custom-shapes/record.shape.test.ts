import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {assertValidShape, type CheckShapeOptions} from '../shape/check-shape.js';
import {defineShape} from '../shape/shape.js';
import {classShape} from './class.shape.js';
import {enumShape} from './enum.shape.js';
import {exactShape} from './exact.shape.js';
import {intersectShape} from './intersect.shape.js';
import {defineKeysShape, extractFiniteKeys, recordShape} from './record.shape.js';
import {unionShape} from './union.shape.js';
import {unknownShape} from './unknown.shape.js';

enum TestEnum {
    First = 'first',
    Second = 'second',
    Third = 'third',
}

describe(recordShape.name, () => {
    it('has proper types', () => {
        const myShape = defineShape(recordShape({keys: '', values: -1}));

        assert.tsType<typeof myShape.runtimeType>().equals<Record<string, number>>();
        assert.deepEquals(myShape.default, {});
    });
    it('fills in default', () => {
        const myShape = defineShape(recordShape({keys: enumShape(TestEnum), values: -1}));

        assert.tsType<typeof myShape.runtimeType>().equals<Record<TestEnum, number>>();
        assert.deepEquals(myShape.default, {
            [TestEnum.First]: -1,
            [TestEnum.Second]: -1,
            [TestEnum.Third]: -1,
        });
    });

    itCases(
        (
            input: unknown,
            shapeInit: Parameters<typeof recordShape>[0],
            options?: CheckShapeOptions,
        ) => assertValidShape(input, recordShape(shapeInit), options),
        [
            {
                it: 'accepts simple string:number record',
                inputs: [
                    {
                        a: 1,
                        b: 2,
                    },
                    {
                        keys: '',
                        values: -1,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'accepts an array of keys',
                inputs: [
                    {
                        a: 1,
                        b: 2,
                    },
                    {
                        keys: [
                            'a',
                            'b',
                        ],
                        values: -1,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'rejects missing keys from array',
                inputs: [
                    {
                        a: 1,
                        b: 2,
                    },
                    {
                        keys: [
                            'a',
                            'b',
                            'c',
                        ],
                        values: -1,
                    },
                ],
                throws: {
                    matchMessage: 'Missing keys: c',
                },
            },
            {
                it: 'allows no keys',
                inputs: [
                    {
                        a: 1,
                        b: 2,
                    },
                    {
                        keys: [],
                        values: -1,
                        additionalProperties: true,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'allows missing array of keys',
                inputs: [
                    {
                        a: 1,
                        b: 2,
                    },
                    {
                        keys: [
                            'a',
                            'b',
                            'c',
                        ],
                        values: -1,
                        partial: true,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'rejects no keys',
                inputs: [
                    {
                        a: 1,
                        b: 2,
                    },
                    {
                        keys: [],
                        values: -1,
                    },
                    {
                        allowExtraKeys: false,
                    },
                ],
                throws: {
                    matchMessage: 'Failure at keys: a,b',
                },
            },
            {
                it: 'requires all keys by default',
                inputs: [
                    {
                        [TestEnum.First]: 1,
                    },
                    {
                        keys: enumShape(TestEnum),
                        values: -1,
                    },
                ],
                throws: {
                    matchMessage: `Missing keys: ${TestEnum.Second},${TestEnum.Third}`,
                },
            },
            {
                it: 'accepts empty object',
                inputs: [
                    {},
                    {
                        keys: '',
                        values: -1,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'rejects wrong value type',
                inputs: [
                    {
                        a: 'not-a-number',
                    },
                    {
                        keys: '',
                        values: -1,
                    },
                ],
                throws: {
                    matchMessage: 'Failure at keys: a',
                },
            },
            {
                it: 'enforces specific key literal',
                inputs: [
                    {
                        allowed: 1,
                    },
                    {
                        keys: exactShape('allowed'),
                        values: -1,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'rejects unexpected key literal',
                inputs: [
                    {
                        notAllowed: 1,
                    },
                    {
                        keys: exactShape('allowed'),
                        values: -1,
                    },
                ],
                throws: {
                    matchMessage: 'Missing keys: allowed',
                },
            },
            {
                it: 'accepts nested object values',
                inputs: [
                    {
                        key1: {
                            a: 'x',
                            b: 1,
                        },
                    },
                    {
                        keys: '',
                        values: {
                            a: '',
                            b: -1,
                        },
                    },
                ],
                throws: undefined,
            },
            {
                it: 'rejects invalid nested object values',
                inputs: [
                    {
                        key1: {
                            a: 'x',
                            b: 'wrong',
                        },
                    },
                    {
                        keys: '',
                        values: {
                            a: '',
                            b: -1,
                        },
                    },
                ],
                throws: {
                    matchMessage: 'Failure at keys: key1',
                },
            },
            {
                it: 'rejects arrays',
                inputs: [
                    [
                        1,
                        2,
                    ],
                    {
                        keys: '',
                        values: -1,
                    },
                ],
                throws: {
                    matchMessage: 'Expected an object',
                },
            },
            {
                it: 'rejects non-objects',
                inputs: [
                    'not-an-object',
                    {
                        keys: '',
                        values: -1,
                    },
                ],
                throws: {
                    matchMessage: 'Expected an object',
                },
            },
            {
                it: 'rejects null',
                inputs: [
                    null,
                    {
                        keys: '',
                        values: -1,
                    },
                ],
                throws: {
                    matchMessage: 'Expected an object',
                },
            },
        ],
    );
});

describe(extractFiniteKeys.name, () => {
    function testExtractFiniteKeys(keysShapeInit: unknown) {
        return extractFiniteKeys(defineKeysShape(keysShapeInit));
    }

    itCases(testExtractFiniteKeys, [
        {
            it: 'handles a string key',
            input: '',
            expect: [],
        },
        {
            it: 'handles an exact string key',
            input: exactShape('hi'),
            expect: [
                'hi',
            ],
        },
        {
            it: 'handles an enum key',
            input: enumShape(TestEnum),
            expect: [
                TestEnum.First,
                TestEnum.Second,
                TestEnum.Third,
            ],
        },
        {
            it: 'handles a class key',
            input: classShape(RegExp),
            /** I don't care what this outputs as long as it doesn't crash. */
            throws: undefined,
        },
        {
            it: 'handles an array key',
            input: [
                'a',
                'b',
                'c',
            ],
            expect: [
                'a',
                'b',
                'c',
            ],
        },
        {
            it: 'handles an and key',
            // @ts-expect-error: intentionally wrong intersection
            input: intersectShape('', -1),
            expect: [],
        },
        {
            it: 'handles an unknown key',
            input: unknownShape(),
            expect: [],
        },
        {
            it: 'uses values from an object (like an enum)',
            input: exactShape({hi: 'there'}),
            expect: ['there'],
        },
        {
            it: 'handles a record shape key',
            input: recordShape({
                keys: '',
                partial: true,
                values: '',
            }),
            expect: [],
        },
        {
            it: 'handles an object key',
            input: {},
            expect: [],
        },
        {
            it: 'handles a union key',
            input: unionShape('', -1, enumShape(TestEnum)),
            expect: [
                TestEnum.First,
                TestEnum.Second,
                TestEnum.Third,
            ],
        },
        {
            it: 'handles a union key with empty object',
            input: unionShape('', -1, enumShape(TestEnum), {}),
            expect: [
                TestEnum.First,
                TestEnum.Second,
                TestEnum.Third,
            ],
        },
        {
            it: 'passes a nested unknown',
            input: unionShape('', -1, enumShape(TestEnum), unknownShape()),
            expect: [
                TestEnum.First,
                TestEnum.Second,
                TestEnum.Third,
            ],
        },
        {
            it: 'accepts a union key',
            input: unionShape('', -1, exactShape('hi'), enumShape(TestEnum)),
            expect: [
                'hi',
                TestEnum.First,
                TestEnum.Second,
                TestEnum.Third,
            ],
        },
    ]);
});

import {assert} from '@augment-vir/assert';
import {type MinMax} from '@augment-vir/common';
import {describe, it, itCases} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {defineShape} from '../shape/shape.js';
import {rangeShape} from './range.shape.js';

describe(rangeShape.name, () => {
    it('has proper types and default', () => {
        const myRange = rangeShape({
            min: 2,
            max: 5,
        });

        assert.tsType<typeof myRange.runtimeType>().equals<number>();
        assert.strictEquals(myRange.default, 3.5);

        const wrapped = defineShape({
            value: rangeShape({
                min: 0,
                max: 10,
            }),
        });
        assert.tsType<typeof wrapped.runtimeType>().equals<{value: number}>();
        assert.deepEquals(wrapped.default, {
            value: 5,
        });
    });

    it('honors custom default', () => {
        const customDefault = rangeShape({
            min: 1,
            max: 9,
            default: 7,
        });
        assert.strictEquals(customDefault.default, 7);
    });

    itCases(
        (input: unknown, range: MinMax) => assertValidShape(input, rangeShape(range)),
        [
            {
                it: 'accepts minimum boundary',
                inputs: [
                    2,
                    {
                        min: 2,
                        max: 5,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'accepts maximum boundary',
                inputs: [
                    5,
                    {
                        min: 2,
                        max: 5,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'accepts mid-range value',
                inputs: [
                    3.5,
                    {
                        min: 2,
                        max: 5,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'rejects below minimum',
                inputs: [
                    1.99,
                    {
                        min: 2,
                        max: 5,
                    },
                ],
                throws: {
                    matchMessage: 'Expected number to be greater or equal to 2',
                },
            },
            {
                it: 'rejects above maximum',
                inputs: [
                    5.01,
                    {
                        min: 2,
                        max: 5,
                    },
                ],
                throws: {
                    matchMessage: 'Expected number to be less or equal to 5',
                },
            },
            {
                it: 'rejects non-number',
                inputs: [
                    '3',
                    {
                        min: 2,
                        max: 5,
                    },
                ],
                throws: {
                    matchMessage: 'Expected number',
                },
            },
            {
                it: 'rejects NaN',
                inputs: [
                    Number.NaN,
                    {
                        min: 2,
                        max: 5,
                    },
                ],
                throws: {
                    matchMessage: 'Expected number',
                },
            },
            {
                it: 'rejects Infinity',
                inputs: [
                    Number.POSITIVE_INFINITY,
                    {
                        min: 2,
                        max: 5,
                    },
                ],
                throws: {
                    matchMessage: 'Expected number',
                },
            },
        ],
    );

    itCases(
        (input: unknown, params: Parameters<typeof rangeShape>[0]) => {
            return assertValidShape(input, rangeShape(params));
        },
        [
            {
                it: 'rejects value equal to min when exclusiveMin is true',
                inputs: [
                    2,
                    {
                        min: 2,
                        max: 5,
                        exclusiveMin: true,
                    },
                ],
                throws: {
                    matchMessage: 'Expected number to be greater than 2',
                },
            },
            {
                it: 'accepts value just above min when exclusiveMin is true',
                inputs: [
                    2.0001,
                    {
                        min: 2,
                        max: 5,
                        exclusiveMin: true,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'accepts maximum when exclusiveMin is true',
                inputs: [
                    5,
                    {
                        min: 2,
                        max: 5,
                        exclusiveMin: true,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'rejects value equal to max when exclusiveMax is true',
                inputs: [
                    5,
                    {
                        min: 2,
                        max: 5,
                        exclusiveMax: true,
                    },
                ],
                throws: {
                    matchMessage: 'Expected number to be less than 5',
                },
            },
            {
                it: 'accepts value just below max when exclusiveMax is true',
                inputs: [
                    4.9999,
                    {
                        min: 2,
                        max: 5,
                        exclusiveMax: true,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'accepts minimum when exclusiveMax is true',
                inputs: [
                    2,
                    {
                        min: 2,
                        max: 5,
                        exclusiveMax: true,
                    },
                ],
                throws: undefined,
            },
            {
                it: 'rejects min when both are exclusive',
                inputs: [
                    2,
                    {
                        min: 2,
                        max: 5,
                        exclusiveMin: true,
                        exclusiveMax: true,
                    },
                ],
                throws: {
                    matchMessage: 'Expected number to be greater than 2',
                },
            },
            {
                it: 'rejects max when both are exclusive',
                inputs: [
                    5,
                    {
                        min: 2,
                        max: 5,
                        exclusiveMin: true,
                        exclusiveMax: true,
                    },
                ],
                throws: {
                    matchMessage: 'Expected number to be less than 5',
                },
            },
            {
                it: 'accepts midpoint when both are exclusive',
                inputs: [
                    3.5,
                    {
                        min: 2,
                        max: 5,
                        exclusiveMin: true,
                        exclusiveMax: true,
                    },
                ],
                throws: undefined,
            },
        ],
    );

    it('sets default in between range', () => {
        assert.strictEquals(
            rangeShape({
                min: 2,
                max: 5,
                exclusiveMin: true,
                exclusiveMax: true,
            }).default,
            3.5,
        );
        assert.strictEquals(
            rangeShape({
                min: 2,
                max: 5,
            }).default,
            3.5,
        );
    });
    it('uses custom default', () => {
        assert.strictEquals(
            rangeShape({
                min: 2,
                max: 5,
                default: 4,
            }).default,
            4,
        );
    });
    it('fails on invalid custom default', () => {
        assert.throws(
            () => {
                return rangeShape({
                    min: 2,
                    max: 5,
                    default: 42,
                });
            },
            {
                matchMessage: 'Expected number to be less or equal to 5',
            },
        );
    });
});

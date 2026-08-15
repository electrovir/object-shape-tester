import {assert} from '@augment-vir/assert';
import {type AtLeastTuple} from '@augment-vir/common';
import {describe, it, itCases} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {defineShape} from '../shape/shape.js';
import {optionalShape} from './optional.shape.js';
import {unionShape} from './union.shape.js';

describe(unionShape.name, () => {
    it('has proper types', () => {
        const myUnionShape = unionShape('hi', -1, 'bye', {
            a: '',
            b: -1,
            c: optionalShape(false),
        });

        assert.tsType<typeof myUnionShape.runtimeType>().equals<
            | string
            | number
            | {
                  a: string;
                  b: number;
                  c?: boolean;
              }
        >();
        assert.strictEquals(myUnionShape.default, 'hi');
    });
    it('has proper types with a union of shapes', () => {
        const myUnionShape = unionShape(
            defineShape({
                hi: '',
            }),
            defineShape(''),
            {
                a: '',
                b: -1,
                c: optionalShape(false),
            },
        );

        assert.tsType<typeof myUnionShape.runtimeType>().equals<
            | string
            | {
                  hi: string;
              }
            | {
                  a: string;
                  b: number;
                  c?: boolean;
              }
        >();
        assert.deepEquals(myUnionShape.default, {
            hi: '',
        });
    });

    it('requires at least one input', () => {
        // @ts-expect-error: missing args
        unionShape();
        unionShape('one input is okay');
        unionShape('multiple', 'inputs', 'are okay');
    });

    itCases(
        (input: unknown, unionOptions: AtLeastTuple<any, 1>) => {
            return assertValidShape(input, unionShape(...unionOptions));
        },
        [
            {
                it: 'works on a union of primitives',
                inputs: [
                    'hi',
                    [
                        '',
                        -1,
                    ],
                ],
                throws: undefined,
            },
            {
                it: 'works on a union with an object',
                inputs: [
                    {
                        a: 'hello there',
                        b: 42,
                    },
                    [
                        '',
                        -1,
                        {
                            a: '',
                            b: -1,
                            c: optionalShape(false),
                        },
                    ],
                ],
                throws: undefined,
            },
            {
                it: 'rejects a union with an invalid object',
                inputs: [
                    {
                        a: 'hello there',
                        b: 42,
                        c: 'wrong',
                    },
                    [
                        '',
                        -1,
                        {
                            a: '',
                            b: -1,
                            c: optionalShape(false),
                        },
                    ],
                ],
                throws: {
                    matchMessage: '/c: Expected boolean',
                },
            },
        ],
    );
});

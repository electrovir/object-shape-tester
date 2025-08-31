import {assert} from '@augment-vir/assert';
import {type AtLeastTuple} from '@augment-vir/common';
import {describe, it, itCases} from '@augment-vir/test';
import {Type} from '@sinclair/typebox';
import {TypeCompiler} from '@sinclair/typebox/compiler';
import {assertValidShape} from '../shape/check-shape.js';
import {defineShape} from '../shape/shape.js';
import {intersectShape} from './intersect.shape.js';
import {optionalShape} from './optional.shape.js';

describe(intersectShape.name, () => {
    it('has proper types', () => {
        const myIntersectShape = intersectShape(
            defineShape({
                hello: 'there',
            }),
            {
                a: '',
                b: -1,
                c: optionalShape(false),
            },
        );

        assert.tsType<typeof myIntersectShape.runtimeType>().equals<
            {
                hello: string;
            } & {
                a: string;
                b: number;
                c?: boolean;
            }
        >();
        assert.deepEquals(myIntersectShape.default, {
            hello: 'there',
            a: '',
            b: -1,
            c: false,
        });
    });

    it('requires at least one input', () => {
        // @ts-expect-error: missing inputs
        intersectShape();
        intersectShape({});
        intersectShape({}, {}, {});
    });

    it('works with normal composite', () => {
        assert.isTrue(
            TypeCompiler.Compile(
                Type.Composite([
                    Type.Object({
                        x: Type.Number(),
                    }),
                    Type.Object({
                        y: Type.Number(),
                    }),
                ]),
            ).Check({
                x: 1,
                y: 1,
            }),
        );
        assert.isFalse(
            TypeCompiler.Compile(
                Type.Composite([
                    Type.Object({
                        x: Type.Number(),
                    }),
                    Type.Object({
                        y: Type.Number(),
                    }),
                ]),
            ).Check({
                x: 1,
            }),
        );

        assert.isLengthAtLeast(
            Array.from(
                TypeCompiler.Compile(
                    Type.Composite([
                        Type.Object({
                            x: Type.Number(),
                        }),
                        Type.Object({
                            y: Type.Number(),
                        }),
                    ]),
                ).Errors({
                    x: 1,
                }),
            ),
            1,
        );
    });

    itCases(
        (input: unknown, intersectOptions: AtLeastTuple<object, 1>) =>
            assertValidShape(input, intersectShape(...intersectOptions)),
        [
            {
                it: 'works with shapes',
                inputs: [
                    {
                        hello: 'hello',
                        a: 'a',
                        b: 42,
                    },
                    [
                        defineShape({
                            hello: 'there',
                        }),
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
                it: 'rejects a missing property',
                inputs: [
                    {
                        hello: 'hello',
                        b: 42,
                    },
                    [
                        defineShape({
                            hello: 'there',
                        }),
                        {
                            a: '',
                            b: -1,
                            c: optionalShape(false),
                        },
                    ],
                ],
                throws: {
                    matchMessage: 'Expected required property',
                },
            },
        ],
    );
});

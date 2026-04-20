import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {Type} from '@sinclair/typebox';
import {assertValidShape, checkValidShape} from '../shape/check-shape.js';
import {defineShape} from '../shape/shape.js';
import {optionalShape} from './optional.shape.js';

describe(optionalShape.name, () => {
    it('has proper types', () => {
        const shape = defineShape({
            a: '',
            b: optionalShape(-1),
        });

        assert.deepEquals(shape.default, {
            a: '',
            b: -1,
        });
        assert.tsType<typeof shape.runtimeType>().equals<{
            a: string;
            b?: number;
        }>();
    });

    it('can be used on non-property values without affecting it', () => {
        const shape = defineShape(optionalShape(''));
        assert.tsType<typeof shape.runtimeType>().equals<string>();
        assertValidShape('hello there', shape);
    });

    it('does not make undefined', () => {
        const myShape = defineShape({
            a: optionalShape(''),
        });

        assert.tsType<Required<typeof myShape.runtimeType>['a']>().equals<string>();

        assert.throws(() =>
            assertValidShape(
                {
                    a: undefined,
                },
                myShape,
            ),
        );
        assertValidShape({}, myShape);
    });

    it('works with schema optional', () => {
        const shape = defineShape({
            a: '',
            b: Type.Optional(
                Type.Number({
                    default: -1,
                }),
            ),
        });

        assert.deepEquals(shape.default, {
            a: '',
            b: -1,
        });
        assert.tsType<typeof shape.runtimeType>().equals<{
            a: string;
            b?: number;
        }>();
    });
    it('can also insert undefined', () => {
        const shape = defineShape({
            a: '',
            b: optionalShape(-1, {
                alsoUndefined: true,
            }),
        });

        assert.tsType<typeof shape.runtimeType>().equals<{
            a: string;
            b?: number | undefined;
        }>();
        assert.tsType<Required<typeof shape.runtimeType>>().equals<{
            a: string;
            b: number | undefined;
        }>();
        assert.tsType<Required<typeof shape.runtimeType>['b']>().equals<number | undefined>();
        assertValidShape(
            {
                a: 'hi',
                b: undefined,
            },
            shape,
        );
        assertValidShape(
            {
                a: 'hi',
            },
            shape,
        );
    });

    itCases(
        (input: unknown, shape: unknown) => checkValidShape(input, defineShape(shape)),
        [
            {
                it: 'accepts missing optional property',
                inputs: [
                    {
                        a: 'hi',
                    },
                    {
                        a: '',
                        b: optionalShape(-1),
                    },
                ],
                expect: true,
            },
            {
                it: 'accepts present optional property',
                inputs: [
                    {
                        a: 'hi',
                        b: 42,
                    },
                    {
                        a: '',
                        b: optionalShape(-1),
                    },
                ],
                expect: true,
            },
            {
                it: 'rejects invalid optional property',
                inputs: [
                    {
                        a: 'hi',
                        b: 'bye',
                    },
                    {
                        a: '',
                        b: optionalShape(-1),
                    },
                ],
                expect: false,
            },
        ],
    );
});

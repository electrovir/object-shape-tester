import {assert} from '@augment-vir/assert';
import {type AnyObject} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {Type} from '@sinclair/typebox';
import {
    assertValidShape,
    ensureNullableShape,
    intersectShape,
    unionShape,
    type EnsureNullableType,
    type IsNullable,
} from '../index.js';

describe('IsNullable', () => {
    it('accepts null', () => {
        assert.tsType<IsNullable<null>>().equals<true>();
    });
    it('accepts undefined', () => {
        assert.tsType<IsNullable<undefined>>().equals<true>();
    });
    it('accepts any', () => {
        assert.tsType<IsNullable<any>>().equals<true>();
    });
    it('accepts unions', () => {
        assert.tsType<IsNullable<string | undefined>>().equals<true>();
        assert.tsType<IsNullable<string | null>>().equals<true>();
        assert.tsType<IsNullable<string | null | undefined>>().equals<true>();
    });
    it('rejects plain types', () => {
        assert.tsType<IsNullable<string>>().equals<false>();
        assert.tsType<IsNullable<number>>().equals<false>();
        assert.tsType<IsNullable<AnyObject>>().equals<false>();
    });
});

describe('EnsureNullable', () => {
    it('makes undefined fully nullable', () => {
        type Result = EnsureNullableType<{
            a: undefined;
        }>;

        assert.tsType<Result>().slowEquals<{
            a?: undefined | null;
        }>();
    });
    it('makes possibly undefined fully nullable', () => {
        type Result = EnsureNullableType<{
            a: undefined | string;
        }>;

        assert.tsType<Result>().slowEquals<{
            a?: undefined | null | string;
        }>();
    });
    it('keeps non-nullable properties', () => {
        type Result = EnsureNullableType<{
            a: undefined | string;
            b: string;
        }>;

        assert.tsType<Result>().slowEquals<{
            a?: undefined | null | string;
            b: string;
        }>();
    });
});

describe(ensureNullableShape.name, () => {
    it('makes null properties optional + undefined', () => {
        const myShape = ensureNullableShape({
            a: '',
            b: unionShape(null, -1),
            c: undefined,
            d: Type.Union(
                [
                    Type.String({default: ''}),
                    Type.Null({default: null}),
                ],
                {
                    default: '',
                },
            ),
            e: -1,
            nested: unionShape(null, {
                f: unionShape(null, ''),
            }),
        });

        assert.tsType<typeof myShape.runtimeType>().equals<{
            a: string;
            b?: number | null | undefined;
            c?: null | undefined;
            d?: string | null | undefined;
            e: number;
            nested?:
                | {
                      f: string | null;
                  }
                | null
                | undefined;
        }>();

        const baseValue = {
            a: 'hi',
            e: 100,
        };

        assertValidShape(baseValue, myShape);
        assertValidShape(
            {
                ...baseValue,
                b: null,
            },
            myShape,
        );
        assertValidShape(
            {
                ...baseValue,
                b: -1,
            },
            myShape,
        );
        assertValidShape(
            {
                ...baseValue,
                b: undefined,
            },
            myShape,
        );
        assertValidShape(
            {
                ...baseValue,
                c: undefined,
            },
            myShape,
        );
        assertValidShape(
            {
                ...baseValue,
                d: undefined,
            },
            myShape,
        );
        assertValidShape(
            {
                ...baseValue,
                b: undefined,
                c: undefined,
                d: undefined,
            },
            myShape,
        );
        assertValidShape(
            {
                ...baseValue,
                b: undefined,
                c: undefined,
                d: undefined,
                nested: {
                    f: undefined,
                },
            },
            myShape,
        );
        assertValidShape(
            {
                ...baseValue,
                b: undefined,
                c: undefined,
                d: undefined,
                nested: {},
            },
            myShape,
        );
        assert.throws(() =>
            assertValidShape(
                {
                    b: null,
                },
                myShape,
            ),
        );
        assert.throws(() =>
            assertValidShape(
                {
                    a: 'hi',
                    b: 'not number',
                },
                myShape,
            ),
        );
    });

    it('works on intersections', () => {
        const myShape = ensureNullableShape(
            intersectShape(
                {
                    a: '',
                    b: unionShape(null, -1),
                },
                {
                    c: unionShape(null, ''),
                    d: -1,
                },
            ),
        );
        assert.tsType<typeof myShape.runtimeType>().equals<{
            a: string;
            b?: number | null | undefined;
            c?: string | null | undefined;
            d: number;
        }>();

        const baseValue = {
            a: 'hi',
            d: 100,
        };

        assertValidShape(baseValue, myShape);
        assertValidShape(
            {
                ...baseValue,
                b: undefined,
                c: undefined,
            },
            myShape,
        );
        assertValidShape(
            {
                ...baseValue,
                b: null,
                c: null,
            },
            myShape,
        );
        assert.throws(() =>
            assertValidShape(
                {
                    b: null,
                },
                myShape,
            ),
        );
    });

    it('does nothing for non object', () => {
        const shape = ensureNullableShape('');
        assertValidShape('hi', shape);
    });
});

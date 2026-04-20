import {assert} from '@augment-vir/assert';
import {type AnyObject} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {Type, type TNull, type TOptional, type TString, type TUndefined} from '@sinclair/typebox';
import {type OptionalKeysOf} from 'type-fest';
import {
    assertValidShape,
    defineShape,
    ensureNullableShape,
    intersectShape,
    nullableShape,
    unionShape,
    type EnsureNullableType,
    type IsNullable,
    type ShapeInitSchema,
    type ShapeInitType,
} from '../index.js';
import {type IsNullableSchema} from './ensure-nullable.shape.js';

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

describe('IsNullableSchema', () => {
    it('accepts nullable schema', () => {
        assert.tsType<IsNullableSchema<TNull>>().equals<true>();
        assert.tsType<IsNullableSchema<TUndefined>>().equals<true>();
        assert.tsType<IsNullableSchema<TOptional<TString>>>().equals<true>();

        assert.tsType<IsNullableSchema<ShapeInitSchema<null>>>().equals<true>();
        assert.tsType<IsNullableSchema<ShapeInitSchema<undefined>>>().equals<true>();
    });
    it('rejects non-nullable schema', () => {
        assert.tsType<IsNullableSchema<ShapeInitSchema<''>>>().equals<false>();
        assert.tsType<IsNullableSchema<TString>>().equals<false>();
        assert.tsType<IsNullableSchema<ShapeInitSchema<-1>>>().equals<false>();
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
    it('works with a nested array', () => {
        const myShape = ensureNullableShape({
            a: [''],
        });

        assert.tsType<typeof myShape.runtimeType>().equals<{
            a: string[];
        }>;
    });

    it('makes null properties optional + undefined', () => {
        const myShape = ensureNullableShape({
            a: '',
            b: unionShape(null, -1),
            c: undefined,
            d: Type.Union(
                [
                    Type.String({
                        default: '',
                    }),
                    Type.Null({
                        default: null,
                    }),
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
                      f?: string | null;
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

    it('works with nullableShape', () => {
        const innerShape = intersectShape(
            {
                id: '',
                name: '',
                isAdmin: false,
            },
            defineShape({
                isBlocked: nullableShape(false),

                settings: nullableShape({
                    disabledNotifications: unionShape(null, false),
                }),
            }),
        );

        const myShape = ensureNullableShape(innerShape);

        assert
            .tsType<
                Extract<ShapeInitType<typeof myShape>['settings'], object> extends never
                    ? false
                    : true
            >()
            .equals<true>();
        // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
        assert.tsType<string | never>().equals<string>();

        type ShapeInitTypeTest = ShapeInitType<typeof innerShape>;
        assert.tsType<ShapeInitTypeTest>().slowEquals<{
            isBlocked?: boolean | null | undefined;
            settings?:
                | {
                      disabledNotifications: boolean | null;
                  }
                | null
                | undefined;
            id: string;
            name: string;
            isAdmin: boolean;
        }>();

        type OptionalKeysTest = OptionalKeysOf<Extract<ShapeInitType<typeof innerShape>, object>>;

        assert.tsType<OptionalKeysTest>().equals<'isBlocked' | 'settings'>();

        assert.tsType<typeof myShape.runtimeType>().slowEquals<{
            id: string;
            name: string;
            isAdmin: boolean;
            isBlocked?: boolean | null | undefined;
            settings?:
                | undefined
                | null
                | {
                      disabledNotifications?: boolean | null | undefined;
                  };
        }>();
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

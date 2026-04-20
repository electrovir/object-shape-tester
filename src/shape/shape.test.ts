import {assert} from '@augment-vir/assert';
import {createUuidV4, type Uuid} from '@augment-vir/common';
import {describe, it, itCases} from '@augment-vir/test';
import {Kind, Type, type Static} from '@sinclair/typebox';
import {type EmptyObject} from 'type-fest';
import {classShape} from '../custom-shapes/class.shape.js';
import {enumShape} from '../custom-shapes/enum.shape.js';
import {exactShape} from '../custom-shapes/exact.shape.js';
import {intersectShape} from '../custom-shapes/intersect.shape.js';
import {optionalShape} from '../custom-shapes/optional.shape.js';
import {rangeShape} from '../custom-shapes/range.shape.js';
import {recordShape} from '../custom-shapes/record.shape.js';
import {tupleShape} from '../custom-shapes/tuple.shape.js';
import {unionShape} from '../custom-shapes/union.shape.js';
import {unknownShape} from '../custom-shapes/unknown.shape.js';
import {uuidShape} from '../custom-shapes/uuid.shape.js';
import {
    defineShape,
    isSchema,
    shapeIdentifier,
    unsafeShape,
    type ShapeInitSchema,
    type ShapeInitType,
} from '../shape/shape.js';
import {assertValidShape} from './check-shape.js';

enum TestEnum {
    First = 'first',
    Second = 'second',
    Third = 'third',
}

describe(defineShape.name, () => {
    it('short circuits if given another shape', () => {
        const originalShape = {
            [shapeIdentifier]: true,
            something: 'hi',
        };

        const newShape = defineShape(originalShape);
        assert.strictEquals(newShape as any, originalShape);
    });
    it('accepts a schema', () => {
        const myShape = defineShape(
            Type.Number({
                default: 4,
            }),
        );

        assert.tsType<typeof myShape.runtimeType>().equals<number>();
        assert.strictEquals(myShape.default, 4);
    });

    it('throws an error if runtimeType is accessed as a value', () => {
        const exampleShape = defineShape({
            hi: '',
        });
        assert.throws(() => {
            exampleShape.runtimeType;
        });
    });

    it('can be enumerated without error', () => {
        const shapeA = defineShape({
            first: 'a',
            second: 'b',
            third: 'c' as const,
        });

        /** This used to trigger an error on the runtimeType getter. */
        assert.isObject(JSON.parse(JSON.stringify(shapeA)));
    });

    it('allows a shape inside of an array', () => {
        const shapeA = defineShape({
            first: 'a',
            second: 'b',
            third: 'c' as const,
        });
        const shapeB = defineShape({
            one: [
                shapeA,
            ],
            two: '',
        });

        assert.deepEquals(shapeB.default, {
            one: [],
            two: '',
        });
        assertValidShape(shapeB.default, shapeB);
    });

    it('allows function properties', () => {
        const shapeWithMethod = defineShape({
            myData: 'a',
            myMethod: (input1: string, input2: number): string => `${input1}: ${input2}`,
        });
        assert.tsType<typeof shapeWithMethod.runtimeType>().equals<{
            myData: string;
            myMethod: (input1: string, input2: number) => string;
        }>();
    });

    const exampleShape = defineShape({
        helloThere: 'hi',
    });

    type MyShape = typeof exampleShape.runtimeType;

    it('does not double wrap a shape definition', () => {
        const originalShape = defineShape({
            hi: '',
        });
        const doubleShape = defineShape(originalShape);

        assertValidShape(
            {
                hi: 'hi',
            },
            originalShape,
        );
        assertValidShape(
            {
                hi: 'hi',
            },
            doubleShape,
        );
    });

    it('creates a simple shape object with correct type', () => {
        assert.tsType<(typeof exampleShape)['runtimeType']>().equals<{
            helloThere: string;
        }>();
        assert.tsType<typeof exampleShape.runtimeType>().equals<{helloThere: string}>();
    });

    it('simplifies const literals', () => {
        const myShape = defineShape({
            value: 4 as const,
            anotherValue: '' as Uuid,
        });

        assert.tsType<(typeof myShape.runtimeType)['value']>().equals<number>;
        assert.tsType<(typeof myShape.runtimeType)['anotherValue']>().equals<string>;
    });

    it('produces run time types from the shape definition', () => {
        const myShapeAssignment: MyShape = {
            helloThere: '',
        };

        const shapeWithExact = defineShape({
            exactProp: exactShape('derp'),
        });
        type MyExact = typeof shapeWithExact.runtimeType;
        const myExactAssignment: MyExact = {
            exactProp: 'derp',
        };
        const myBadExactAssignment: MyExact = {
            // @ts-expect-error: intentionally wrong value
            exactProp: 'four',
        };
    });

    it('works with bare custom shapes', () => {
        const myUnknown = defineShape(unknownShape());
        const myInstance: (typeof myUnknown)['runtimeType'] = myUnknown.default;

        assert.tsType(myInstance).equals<unknown>();

        const myNestedShape = defineShape({
            nested: myUnknown,
        });
        const myNestedInstance: (typeof myNestedShape)['runtimeType'] = myNestedShape.default;
        assert.tsType(myNestedInstance).equals<{nested: unknown}>();
    });

    it('works with complex nested shapes', () => {
        const myShape = defineShape({
            a: exactShape({
                what: 'who',
            }),
            b: unionShape(0, ''),
            c: unionShape(0, exactShape('hello there')),
        });

        const myNestedShape = defineShape({
            nested: unionShape(myShape, 0),
        });
        const myNestedInstance: (typeof myNestedShape)['runtimeType'] = myNestedShape.default;
        assert.tsType<(typeof myNestedShape)['runtimeType']>().equals<{
            nested:
                | number
                | {
                      a: Readonly<{
                          what: 'who';
                      }>;
                      b: number | string;
                      c: number | 'hello there';
                  };
        }>();
    });

    it('works with nested exact specifiers', () => {
        const myShape = defineShape({
            a: exactShape({
                what: 'who',
            }),
            b: unionShape(0, exactShape('hello there')),
            c: unionShape(0, exactShape('hello there')),
        });

        assert.tsType<(typeof myShape)['runtimeType']>().equals<{
            a: Readonly<{what: 'who'}>;
            b: number | 'hello there';
            c: number | 'hello there';
        }>();
    });

    it('expands nested shape types', () => {
        const timezoneShape = defineShape({
            _isTimezone: exactShape(true),
            /** The IANA name of the timezone */
            ianaName: 'utc',
        });

        const dateOnlyUnitsShape = defineShape({
            /**
             * The full, four digit year.
             *
             * @example 2023;
             */
            year: 0,
            /** A month of the year: 1-12 */
            month: 0,
            /** A day of the month: 1-31 depending on the month */
            day: 0,
        });

        const fullDateShape = defineShape(
            intersectShape(dateOnlyUnitsShape, {
                /**
                 * The unix timestamp for the accompanying date and time units with the accompanying
                 * timezone.
                 */
                timestamp: 0,
                /** The timezone which the accompanying date units are meant to be expressed in. */
                timezone: timezoneShape,
            }),
        );

        const fullDate: (typeof fullDateShape)['runtimeType'] = {
            day: 0,
            month: 0,
            timestamp: 0,
            year: 0,
            timezone: {
                _isTimezone: true,
                ianaName: 'anything',
            },
        };
    });

    it('does not preserve const assignments', () => {
        const shapeA = defineShape({
            first: 'a',
            second: 'b',
            third: 'c' as const,
        });
        assert.tsType<typeof shapeA.runtimeType>().equals<{
            first: string;
            second: string;
            third: string;
        }>();
    });

    it('constructs class shapes', () => {
        const shapeA = defineShape({
            first: 'a',
            second: 'b',
            myClass: classShape(Error),
        });
        assert.tsType<typeof shapeA.runtimeType>().equals<{
            first: string;
            second: string;
            myClass: Error;
        }>();
        const defaultValue = shapeA.default;
        assert.deepEquals(defaultValue, {
            first: 'a',
            second: 'b',
            myClass: defaultValue.myClass,
        });

        assert.instanceOf(defaultValue.myClass, Error);
    });

    function testShapeDefaultValue(init: unknown) {
        return defineShape(init).default;
    }

    itCases(testShapeDefaultValue, [
        {
            it: 'defaults an optional property to its inputs',
            input: optionalShape('hi'),
            expect: 'hi',
        },
        {
            it: 'defaults a tuple to its inputs',
            input: tupleShape('', -1, exactShape('hi')),
            expect: [
                '',
                -1,
                'hi',
            ],
        },
        {
            it: 'allows a custom enumShape default value',
            input: enumShape(TestEnum, TestEnum.Second),
            expect: TestEnum.Second,
        },
        {
            it: 'uses a default enum value',
            input: enumShape(TestEnum),
            expect: TestEnum.First,
        },
        {
            it: 'allows defining a default value for unknown',
            input: unknownShape('my default value'),
            expect: 'my default value',
        },
        {
            it: 'defaults unknown shape to undefined',
            input: unknownShape(),
            expect: undefined,
        },
        {
            it: 'defaults numeric range to mid point',
            input: rangeShape({
                min: 1,
                max: 10,
            }),
            expect: 5.5,
        },
        {
            it: 'defaults partial record shape to empty object',
            input: recordShape({
                keys: exactShape('hi'),
                values: {
                    hi: '',
                },
                partial: true,
            }),
            expect: {},
        },
        {
            it: 'unwraps optional',
            input: optionalShape(unionShape([''], '')),
            expect: [],
        },
    ]);

    it('creates callable function defaults', () => {
        function innerMethod() {
            return 'a' as string;
        }

        const shape = defineShape(innerMethod);
        assert.tsType<typeof shape.runtimeType>().equals<() => string>();
        assert.strictEquals(shape.default, innerMethod);
        assert.strictEquals(innerMethod(), shape.default());
    });

    it('creates class default value', () => {
        const myShape = defineShape(classShape(Error));
        assert.instanceOf(myShape.default, Error);
    });

    it('creates a valid default value for required record keys', () => {
        const exampleShape = defineShape(
            recordShape({
                keys: enumShape(TestEnum),
                values: 42,
            }),
        );

        assertValidShape(exampleShape.default, exampleShape);
        assert.deepEquals(exampleShape.default, {
            [TestEnum.First]: 42,
            [TestEnum.Second]: 42,
            [TestEnum.Third]: 42,
        });
    });
});

describe(isSchema.name, () => {
    itCases(isSchema, [
        {
            it: 'rejects a number',
            input: 4,
            expect: false,
        },
        {
            it: 'rejects a string',
            input: 'hi',
            expect: false,
        },
        {
            it: 'rejects undefined',
            input: undefined,
            expect: false,
        },
        {
            it: 'rejects null',
            input: null,
            expect: false,
        },
        {
            it: 'rejects null',
            input: null,
            expect: false,
        },
        {
            it: 'rejects an empty object',
            input: {},
            expect: false,
        },
        {
            it: 'accepts TNumber',
            input: Type.Number(),
            expect: true,
        },
        {
            it: 'accepts TString',
            input: Type.String(),
            expect: true,
        },
        {
            it: 'accepts TObject',
            input: Type.Object({
                a: Type.Number(),
            }),
            expect: true,
        },
        {
            it: 'accepts TArray',
            input: Type.Array(Type.String()),
            expect: true,
        },
        {
            it: 'accepts TTuple',
            input: Type.Tuple([
                Type.String(),
                Type.Number(),
            ]),
            expect: true,
        },
        {
            it: 'accepts TUnion',
            input: Type.Union([
                Type.String(),
                Type.Number(),
            ]),
            expect: true,
        },
        {
            it: 'accepts TLiteral',
            input: Type.Literal('x'),
            expect: true,
        },
        {
            it: 'accepts TRecord',
            input: Type.Record(Type.String(), Type.Number()),
            expect: true,
        },
        {
            it: 'accepts TOptional',
            input: Type.Optional(Type.String()),
            expect: true,
        },
        {
            it: 'accepts a crafted object with [Kind] symbol',
            input: {
                [Kind]: 'Fake' as any,
            },
            expect: true,
        },
        {
            it: 'rejects an array',
            input: [],
            expect: false,
        },
        {
            it: 'rejects a function',
            input() {
                /* noop */
            },
            expect: false,
        },
        {
            it: 'rejects a symbol',
            input: Symbol('s'),
            expect: false,
        },
        {
            it: 'rejects a bigint',
            input: 10n,
            expect: false,
        },
        {
            it: 'rejects a Date',
            input: new Date(),
            expect: false,
        },
        {
            it: 'rejects a RegExp',
            input: /x/,
            expect: false,
        },
        {
            it: 'rejects a Map',
            input: new Map(),
            expect: false,
        },
        {
            it: 'rejects a Set',
            input: new Set(),
            expect: false,
        },
        {
            it: 'rejects a Promise',
            input: Promise.resolve(1),
            expect: false,
        },
        {
            it: 'rejects a class instance',
            input: new (class Foo {
                public value = 1;
            })(),
            expect: false,
        },
        {
            it: 'rejects a prototype-less object',
            input: Object.create(null),
            expect: false,
        },
        {
            it: 'rejects a typed array',
            input: new Uint8Array(2),
            expect: false,
        },
    ]);
});

describe(unsafeShape.name, () => {
    it('uses the explicit type rather than inferring from the init', () => {
        const inferredShape = defineShape({
            hello: '',
        });
        assert.tsType<typeof inferredShape.runtimeType>().equals<{hello: string}>();

        type ExplicitType = {
            hello: string;
            extra: number;
        };
        const explicitShape = unsafeShape<ExplicitType>(
            defineShape({
                hello: '',
            }),
        );
        assert.tsType<typeof explicitShape.runtimeType>().equals<ExplicitType>();
    });

    it('allows a branded type that could not be inferred from the init', () => {
        type BrandedId = string & {__brand: 'BrandedId'};
        const branded = unsafeShape<BrandedId>(defineShape(''));

        assert.tsType<typeof branded.runtimeType>().equals<BrandedId>();
        assert.tsType<typeof branded.runtimeType>().notEquals<string>();
    });

    it('allows the explicit type to diverge entirely from the init', () => {
        const diverged = unsafeShape<number>(defineShape(''));
        assert.tsType<typeof diverged.runtimeType>().equals<number>();
    });

    it('returns the init unchanged at runtime', () => {
        const innerShape = defineShape({
            hello: '',
        });
        const wrapped = unsafeShape<{hello: string; extra: number}>(innerShape);

        assert.strictEquals(wrapped as any, innerShape);
        assert.deepEquals(wrapped.default, {
            hello: '',
        } as any);
        assertValidShape(
            {
                hello: 'world',
            },
            wrapped,
        );
        assert.tsType(wrapped.default).equals<Readonly<{hello: string; extra: number}>>();
    });

    it('accepts a raw schema as init', () => {
        const fromSchema = unsafeShape<'literal-value'>(
            Type.String({
                default: 'literal-value',
            }),
        );
        assert.tsType<typeof fromSchema.runtimeType>().equals<'literal-value'>();
        assert.strictEquals(fromSchema.default, 'literal-value');
    });
});

describe('ShapeInitType', () => {
    it('maintains primitives', () => {
        assert.tsType<ShapeInitType<string>>().equals<string>();
        assert.tsType<ShapeInitType<''>>().equals<string>();
        const exactString = exactShape('');
        assert.tsType<ShapeInitType<typeof exactString>>().equals<''>();

        assert.tsType<ShapeInitType<number>>().equals<number>();
        assert.tsType<ShapeInitType<42>>().equals<number>();
        const exactNumber = exactShape(42);
        assert.tsType<ShapeInitType<typeof exactNumber>>().equals<42>();

        assert.tsType<ShapeInitType<undefined>>().equals<undefined>();
        assert.tsType<ShapeInitType<null>>().equals<null>();

        assert.tsType<ShapeInitType<bigint>>().equals<bigint>();
        assert.tsType<ShapeInitType<42n>>().equals<bigint>();
        const exactBigint = exactShape(42n);
        assert.tsType<ShapeInitType<typeof exactBigint>>().equals<42n>();

        assert.tsType<ShapeInitType<boolean>>().equals<boolean>();
        assert.tsType<ShapeInitType<false>>().equals<boolean>();
        const exactBoolean = exactShape(false);
        assert.tsType<ShapeInitType<typeof exactBoolean>>().equals<false>();

        const testSymbol = Symbol('test');

        assert.tsType<ShapeInitType<symbol>>().equals<symbol>();
        assert.tsType<ShapeInitType<typeof testSymbol>>().equals<symbol>();
        const exactSymbol = exactShape(testSymbol);
        assert.tsType<ShapeInitType<typeof exactSymbol>>().equals<typeof testSymbol>();
    });

    it('maintains array values', () => {
        assert.tsType<ShapeInitType<(string | number)[]>>().equals<(string | number)[]>();
        assert.tsType<ShapeInitType<[string, number]>>().equals<(string | number)[]>();
    });

    it('maintains function types', () => {
        assert
            .tsType<ShapeInitType<(arg1: string, arg2: number) => boolean>>()
            .equals<(param1: string, param2: number) => boolean>();
    });

    it('maintains object values', () => {
        assert
            .tsType<ShapeInitType<{[key in string]: number}>>()
            .equals<{[key in string]: number}>();
        assert
            .tsType<
                Static<
                    ShapeInitSchema<{
                        a: number;
                        b: string;
                    }>
                >
            >()
            .equals<{
                a: number;
                b: string;
            }>();
    });

    it('handles multiples shapes', () => {
        const shapeDefinition = defineShape({
            stringProp: 'hello',
            nestedObjectProp: {
                nestedString: '',
                nestedMaybeNumber: unionShape(0, undefined),
                // @ts-expect-error invalid inputs to intersect shape
                myNestedAnd: intersectShape('', 0),
            },
            myGenericRange: rangeShape({
                min: 1,
                max: 10,
            }),
            mySpecificRange: rangeShape<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>({
                min: 1,
                max: 10,
            }),
            myTuple: tupleShape('', -1, exactShape('hi')),
            myOr: unionShape('', 0),
            myAnd: intersectShape(
                {
                    a: '',
                },
                {
                    b: 0,
                },
            ),
            mySimpleArray: [''],
            indexedPartial: recordShape({
                keys: enumShape(TestEnum),
                values: '',
                partial: true,
            }),
            preservedStringType: '' as `${number}-${number}-${number}`,
            uuid: uuidShape(),
            indexedRequired: recordShape({
                keys: enumShape(TestEnum),
                values: '',
            }),
            myClassShape: classShape(Error),
            complexArray: [
                '',
                0,
            ],
            idk: unknownShape(),
            myEnum: enumShape(TestEnum),
            myMultiArray: [
                '',
                0,
            ],

            myObjectOr: unionShape(
                {
                    hello: 'there',
                    why: exactShape('are we here'),
                },
                0,
            ),
            myExactObject: exactShape({
                nestedExact: 'hello',
                moreNestedExact: 'why',
            }),
            myExact: exactShape('hello there'),

            myOptionalObject: {
                a: -1,
                b: 'hi',
                c: optionalShape('hi'),
            },
        });

        assert.tsType<typeof shapeDefinition.runtimeType>().slowEquals<{
            stringProp: string;
            nestedObjectProp: {
                nestedString: string;
                nestedMaybeNumber: number | undefined;
                myNestedAnd: EmptyObject;
            };
            myGenericRange: number;
            mySpecificRange: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
            myTuple: [string, number, 'hi'];
            myOr: string | number;
            myAnd: {
                a: string;
                b: number;
            };
            preservedStringType: string;
            uuid: Uuid;
            mySimpleArray: string[];
            indexedPartial: Partial<Record<TestEnum, string>>;
            indexedRequired: Record<TestEnum, string>;
            myClassShape: Error;
            complexArray: (string | number)[];
            idk: unknown;
            myEnum: TestEnum;
            myMultiArray: (string | number)[];
            myObjectOr:
                | {
                      hello: string;
                      why: 'are we here';
                  }
                | number;
            myExactObject: Readonly<{
                nestedExact: 'hello';
                moreNestedExact: 'why';
            }>;
            myExact: 'hello there';

            myOptionalObject: {
                a: number;
                b: string;
                c?: string | undefined;
            };
        }>();
    });

    it('works with tuples', () => {
        const myShape = defineShape(tupleShape('', -1, exactShape('hi')));
        assert.tsType<(typeof myShape)['runtimeType']>().equals<[string, number, 'hi']>();
    });

    it('unwraps optional specifiers', () => {
        const myOptionalShape = defineShape({
            a: optionalShape('a'),
            b: optionalShape(unionShape('a', -3)),
            c: intersectShape(
                {
                    a: '',
                },
                {
                    b: optionalShape(-3),
                },
            ),
        });

        assert.tsType(myOptionalShape.default).equals<
            Readonly<{
                a?: string;
                b?: string | number;
                c: {
                    a: string;
                } & {
                    b?: number;
                };
            }>
        >();

        assert.tsType<(typeof myOptionalShape)['runtimeType']>().equals<{
            a?: string;
            b?: string | number;
            c: {
                a: string;
            } & {
                b?: number;
            };
        }>();
    });

    it('does not add required to records', () => {
        const shapeTest = defineShape({
            basicKeys: recordShape({
                keys: '',
                values: -1,
            }),
        });

        assert.tsType(shapeTest.default.basicKeys).equals<Record<string, number>>();

        assertValidShape(
            {
                basicKeys: {},
            },
            shapeTest,
        );
        assertValidShape(
            {
                basicKeys: {
                    hi: 3,
                },
            },
            shapeTest,
        );
    });

    it('allows custom specifiers for record keys', () => {
        const shapeTest = defineShape({
            basicKeys: recordShape({
                keys: uuidShape(),
                values: -1,
                partial: true,
            }),
        });

        assert.tsType(shapeTest.default.basicKeys).equals<Partial<Record<Uuid, number>>>();

        assertValidShape(
            {
                basicKeys: {},
            },
            shapeTest,
        );
        assertValidShape(
            {
                basicKeys: {
                    [createUuidV4()]: 3,
                },
            },
            shapeTest,
        );
    });

    it('works with or and null', () => {
        const myNullableShape = defineShape(
            unionShape(null, {
                hello: '',
            }),
        );

        assert.tsType<typeof myNullableShape.runtimeType>().equals<{hello: string} | null>();
    });

    it('works with exact strings', () => {
        const myShape = defineShape({
            message: exactShape('hello'),
        });
        type MyType = typeof myShape.runtimeType;

        assert.tsType<MyType>().equals<{
            message: 'hello';
        }>();
    });

    it('works with exact record keys', () => {
        const shapeWithIndexedKeys = defineShape({
            thing: '',
            nestedValues: recordShape({
                keys: unionShape(exactShape('hi'), exactShape('bye')),
                values: {
                    helloThere: 0,
                },
                partial: true,
            }),
        });

        assert.tsType<typeof shapeWithIndexedKeys.runtimeType>().equals<{
            thing: string;
            nestedValues: Partial<Record<'hi' | 'bye', {helloThere: number}>>;
        }>();
    });

    it('works with vague string record keys', () => {
        const shapeWithIndexedKeys = defineShape({
            thing: '',
            nestedValues: recordShape({
                keys: '',
                values: 0,
                partial: true,
            }),
        });

        assert.tsType<typeof shapeWithIndexedKeys.runtimeType>().equals<{
            thing: string;
            nestedValues: Partial<Record<string, number>>;
        }>();
    });

    it('works with non-partial vague string record keys', () => {
        const shapeWithIndexedKeys = defineShape({
            thing: '',
            nestedValues: recordShape({
                keys: '',
                values: 0,
            }),
        });

        assert.tsType<typeof shapeWithIndexedKeys.runtimeType>().equals<{
            thing: string;
            nestedValues: Record<string, number>;
        }>();

        /**
         * Despite the required, an empty object still works here because it doesn't make any sense
         * to require a key of type `string`.
         */
        const example: typeof shapeWithIndexedKeys.runtimeType = {
            thing: 'hi',
            nestedValues: {},
        };
    });
});

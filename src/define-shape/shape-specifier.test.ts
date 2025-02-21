import {assert} from '@augment-vir/assert';
import {createUuidV4, randomInteger, randomString, type Uuid} from '@augment-vir/common';
import {describe, it, itCases} from '@augment-vir/test';
import {uuidShape} from '../custom-specifiers/custom-string-shapes.js';
import {assertValidShape} from '../verify-shape/verify-shape.js';
import {defineShape} from './define-shape.js';
import {
    and,
    classShape,
    enumShape,
    exact,
    expandIndexedKeysKeys,
    indexedKeys,
    matchesShape,
    numericRange,
    optional,
    or,
    tupleShape,
    unknownShape,
} from './shape-specifiers.js';

enum TestEnum {
    First = 'first',
    Second = 'second',
    Third = 'third',
}

describe('ShapeToRuntimeType', () => {
    it('converts specifiers into their part types', () => {
        const shapeDefinition = defineShape({
            stringProp: 'hello',
            nestedObjectProp: {
                nestedString: '',
                nestedMaybeNumber: or(0, undefined),
                myNestedAnd: and('', 0),
            },
            myGenericRange: numericRange(1, 10),
            mySpecificRange: numericRange<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>(1, 10),
            myTuple: tupleShape('', -1, exact('hi')),
            myOr: or('', 0),
            myAnd: and({a: ''}, {b: 0}),
            mySimpleArray: [''],
            indexedPartial: indexedKeys({
                keys: enumShape(TestEnum),
                values: '',
                required: false,
            }),
            preservedStringType: '' as `${number}-${number}-${number}`,
            uuid: uuidShape,
            indexedRequired: indexedKeys({
                keys: enumShape(TestEnum),
                values: '',
                required: true,
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

            myObjectOr: or(
                {
                    hello: 'there',
                    why: exact('are we here', 'are you there'),
                },
                0,
            ),
            myExactObject: exact({
                nestedExact: 'hello',
                moreNestedExact: 'why',
            }),
            myExact: exact('hello there'),

            myOptionalObject: {
                a: -1,
                b: 'hi',
                c: optional('hi'),
            },
        });

        assert.tsType<typeof shapeDefinition.runtimeType>().slowEquals<{
            stringProp: string;
            nestedObjectProp: {
                nestedString: string;
                nestedMaybeNumber: number | undefined;
                myNestedAnd: never;
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
                      why: 'are we here' | 'are you there';
                  }
                | number;
            myExactObject: {
                nestedExact: 'hello';
                moreNestedExact: 'why';
            };
            myExact: 'hello there';

            myOptionalObject: {
                a: number;
                b: string;
                c?: string;
            };
        }>();
    });

    it('works with tuples', () => {
        const myShape = defineShape(tupleShape('', -1, exact('hi')));
        assert.tsType<(typeof myShape)['runtimeType']>().equals<[string, number, 'hi']>();
    });

    it('unwraps optional specifiers', () => {
        const optionalShape = defineShape({
            a: optional('a'),
            b: optional(or('a', -3)),
            c: and(
                {a: ''},
                {
                    b: optional(-3),
                },
            ),
        });

        assert.tsType(optionalShape.defaultValue).equals<
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

        assert.tsType<(typeof optionalShape)['runtimeType']>().equals<{
            a?: string;
            b?: string | number;
            c: {
                a: string;
            } & {
                b?: number;
            };
        }>();
    });

    it('does not add required to index key objects', () => {
        const shapeTest = defineShape({
            basicKeys: indexedKeys({
                keys: '',
                required: true,
                values: -1,
            }),
        });

        assert.tsType(shapeTest.defaultValue.basicKeys).equals<Record<string, number>>();

        assertValidShape({basicKeys: {}}, shapeTest);
        assertValidShape(
            {
                basicKeys: {
                    hi: 3,
                },
            },
            shapeTest,
        );
    });

    it('allows custom specifiers for indexed keys', () => {
        const shapeTest = defineShape({
            basicKeys: indexedKeys({
                keys: uuidShape,
                values: -1,
                required: false,
            }),
        });

        assert.tsType(shapeTest.defaultValue.basicKeys).equals<Partial<Record<Uuid, number>>>();

        assertValidShape({basicKeys: {}}, shapeTest);
        assertValidShape(
            {
                basicKeys: {
                    [createUuidV4()]: 3,
                },
            },
            shapeTest,
        );
    });

    it('applies readonly', () => {
        const shapeDefinition = defineShape(
            {
                stringProp: 'hello',
                nestedObjectProp: {
                    nestedString: '',
                    nestedMaybeNumber: or(0, undefined),
                    myNestedAnd: and('', 0),
                },
                myOr: or('', 0),
                myAnd: and({a: ''}, {b: 0}),
                mySimpleArray: [''],
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
                myObjectOr: or(
                    {
                        hello: 'there',
                        why: exact('are we here', 'are you there'),
                    },
                    0,
                ),
                myExactObject: exact({
                    nestedExact: 'hello',
                    moreNestedExact: 'why',
                }),
                myExact: exact('hello there'),
            },
            true,
        );

        assert.tsType<typeof shapeDefinition.runtimeType>().slowEquals<
            Readonly<{
                stringProp: string;
                nestedObjectProp: Readonly<{
                    nestedString: string;
                    nestedMaybeNumber: number | undefined;
                    myNestedAnd: string & number;
                }>;
                myOr: string | number;
                myAnd: Readonly<{
                    a: string;
                    b: number;
                }>;
                mySimpleArray: ReadonlyArray<string>;
                myClassShape: Readonly<Error>;
                complexArray: ReadonlyArray<string | number>;
                idk: unknown;
                myEnum: TestEnum;
                myMultiArray: ReadonlyArray<string | number>;
                myObjectOr:
                    | Readonly<{
                          hello: string;
                          why: 'are we here' | 'are you there';
                      }>
                    | number;
                myExactObject: Readonly<{
                    nestedExact: 'hello';
                    moreNestedExact: 'why';
                }>;
                myExact: 'hello there';
            }>
        >();
    });

    it('works with or and null', () => {
        const myNullableShape = defineShape(or(null, {hello: ''}), true);

        assert
            .tsType<typeof myNullableShape.runtimeType>()
            .equals<Readonly<{hello: string} | null>>();
    });

    it('works with exact strings', () => {
        const myShape = defineShape({message: exact('hello')});
        type MyType = typeof myShape.runtimeType;

        assert.tsType<MyType>().equals<{
            message: 'hello';
        }>();
    });

    it('works with exact indexed keys', () => {
        const shapeWithIndexedKeys = defineShape({
            thing: '',
            nestedValues: indexedKeys({
                keys: or(exact('hi'), exact('bye')),
                values: {
                    helloThere: 0,
                },
                required: false,
            }),
        });

        assert.tsType<typeof shapeWithIndexedKeys.runtimeType>().equals<{
            thing: string;
            nestedValues: Partial<Record<'hi' | 'bye', {helloThere: number}>>;
        }>();
    });

    it('works with vague string indexed keys', () => {
        const shapeWithIndexedKeys = defineShape({
            thing: '',
            nestedValues: indexedKeys({
                keys: '',
                values: 0,
                required: false,
            }),
        });

        assert.tsType<typeof shapeWithIndexedKeys.runtimeType>().equals<{
            thing: string;
            nestedValues: Partial<Record<string, number>>;
        }>();
    });

    it('works with nonsensically required vague string indexed keys', () => {
        const shapeWithIndexedKeys = defineShape({
            thing: '',
            nestedValues: indexedKeys({
                keys: '',
                values: 0,
                required: true,
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

describe(matchesShape.name, () => {
    itCases(matchesShape, [
        {
            it: 'always true for unknown specifier',
            inputs: [
                Math.random() > 0.5 ? '' : 4,
                unknownShape(),
            ],
            expect: true,
        },
        {
            it: 'matches valid numeric range',
            inputs: [
                5,
                numericRange(1, 10),
            ],
            expect: true,
        },
        {
            it: 'rejects non-number numeric range',
            inputs: [
                {hi: 'hi'},
                numericRange(1, 10),
            ],
            expect: false,
        },
        {
            it: 'rejects invalid numeric range',
            inputs: [
                11,
                numericRange(1, 10),
            ],
            expect: false,
        },
        {
            it: 'matches unknown indexed keys',
            inputs: [
                {hi: 'there'},
                indexedKeys({
                    keys: unknownShape(),
                    required: true,
                    values: '',
                }),
                true,
            ],
            expect: true,
        },
        {
            it: 'accepts a valid indexed subject',
            inputs: [
                {[randomString()]: randomInteger({max: 100, min: 0})},
                indexedKeys({
                    keys: '',
                    values: 0,
                    required: false,
                }),
            ],
            expect: true,
        },
        {
            it: 'rejects indexedKeys subject that is not an object',
            inputs: [
                5,
                indexedKeys({
                    keys: '',
                    values: 0,
                    required: false,
                }),
            ],
            expect: false,
        },
        {
            it: 'accepts string/number indexedKeys subject keys mismatch because number keys are casted to strings anyway',
            inputs: [
                {0: 0},
                indexedKeys({
                    keys: '',
                    values: 0,
                    required: false,
                }),
            ],
            expect: true,
        },
        {
            it: 'rejects mismatched exact indexedKeys keys',
            inputs: [
                {no: 0},
                indexedKeys({
                    keys: exact('hi'),
                    values: 0,
                    required: false,
                }),
            ],
            expect: false,
        },
        {
            it: 'accepts valid exact indexedKeys keys',
            inputs: [
                {hi: 0},
                indexedKeys({
                    keys: exact('hi'),
                    values: 0,
                    required: false,
                }),
            ],
            expect: true,
        },
        {
            it: 'accepts a class instance',
            inputs: [
                new Error(),
                classShape(Error),
            ],
            expect: true,
        },
        {
            it: 'rejects the wrong class instance',
            inputs: [
                new Error(),
                classShape(HTMLElement),
            ],
            expect: false,
        },
        {
            it: 'rejects invalid indexedKeys subject values',
            inputs: [
                {hi: 'hi'},
                indexedKeys({
                    keys: '',
                    values: 0,
                    required: false,
                }),
            ],
            expect: false,
        },
    ]);
});

describe(or.name, () => {
    it('requires at least one input', () => {
        // @ts-expect-error: missing args
        or();
        or('one input is okay');
        or('multiple', 'inputs', 'are okay');
    });
});

describe(enumShape.name, () => {
    it('only allows one input', () => {
        // @ts-expect-error: missing args
        enumShape();
        // @ts-expect-error: wrong input
        enumShape('input must be an object');
        enumShape(TestEnum);
        enumShape({objectIs: 'okay too'});
        // @ts-expect-error: can only have one input
        enumShape(TestEnum, {multipleEnums: 'is not okay'});
    });
});

describe(unknownShape.name, () => {
    it('optionally allows a single input', () => {
        // omitting inputs entirely is allowed
        unknownShape();
        unknownShape('single input is allowed');
        // any input is allowed
        unknownShape({});
        // @ts-expect-error: multiple inputs are not allowed
        unknownShape('multiple', 'are not allowed either');
    });
});

describe(classShape.name, () => {
    it('requires a constructor input', () => {
        // @ts-expect-error: a string instance is not a constructor
        classShape('hi');
        // @ts-expect-error an object is not a constructor
        classShape({});
        // @ts-expect-error a function is not a constructor
        classShape(() => {});

        classShape(Error);
        classShape(HTMLElement);
    });
});

describe(and.name, () => {
    it('requires at least one input', () => {
        // @ts-expect-error: missing inputs
        and();
        and('one input is okay');
        and('multiple', 'inputs', 'are okay');
    });
});

describe(exact.name, () => {
    it('requires only one input', () => {
        // @ts-expect-error: missing inputs
        exact();
        exact('one input is okay');
        exact('multiple', 'inputs', 'are okay');
    });
});

describe(expandIndexedKeysKeys.name, () => {
    itCases(expandIndexedKeysKeys, [
        {
            it: 'handles a string key',
            input: indexedKeys({
                keys: '',
                required: false,
                values: '',
            }),
            expect: true,
        },
        {
            it: 'handles an exact string key',
            input: indexedKeys({
                keys: exact('hi'),
                required: false,
                values: '',
            }),
            expect: [
                'hi',
            ],
        },
        {
            it: 'handles an enum key',
            input: indexedKeys({
                keys: enumShape(TestEnum),
                required: false,
                values: '',
            }),
            expect: [
                TestEnum.First,
                TestEnum.Second,
                TestEnum.Third,
            ],
        },
        {
            it: 'rejects a class key',
            input: indexedKeys({
                // @ts-expect-error: intentionally wrong key
                keys: classShape(RegExp),
                required: false,
                values: '',
            }),
            expect: false,
        },
        {
            it: 'rejects an and key',
            input: indexedKeys({
                // @ts-expect-error: intentionally wrong key
                keys: and('', -1),
                required: false,
                values: '',
            }),
            expect: false,
        },
        {
            it: 'allows an unknown key',
            input: indexedKeys({
                keys: unknownShape(),
                required: false,
                values: '',
            }),
            expect: true,
        },
        {
            it: 'rejects an exact object',
            input: indexedKeys({
                // @ts-expect-error: intentionally wrong key
                keys: exact({hi: 'there'}),
                required: false,
                values: '',
            }),
            expect: false,
        },
        {
            it: 'rejects an indexedKeys key',
            input: indexedKeys({
                // @ts-expect-error: intentionally wrong key
                keys: indexedKeys({
                    keys: '',
                    required: false,
                    values: '',
                }),
                required: false,
                values: '',
            }),
            expect: false,
        },
        {
            it: 'rejects an object key',
            input: indexedKeys({
                // @ts-expect-error: intentionally wrong key
                keys: {},
                required: false,
                values: '',
            }),
            expect: false,
        },
        {
            it: 'accepts an or key',
            input: indexedKeys({
                keys: or('', -1, enumShape(TestEnum)),
                required: false,
                values: '',
            }),
            expect: [
                TestEnum.First,
                TestEnum.Second,
                TestEnum.Third,
            ],
        },
        {
            it: 'rejects a bad nested or',
            input: indexedKeys({
                // @ts-expect-error: intentionally wrong key
                keys: or('', -1, enumShape(TestEnum), {}),
                required: false,
                values: '',
            }),
            expect: false,
        },
        {
            it: 'passes a nested unknown',
            input: indexedKeys({
                keys: or('', -1, enumShape(TestEnum), unknownShape()),
                required: false,
                values: '',
            }),
            expect: [
                TestEnum.First,
                TestEnum.Second,
                TestEnum.Third,
            ],
        },
        {
            it: 'accepts an or key',
            input: indexedKeys({
                keys: or('', -1, exact('hi'), enumShape(TestEnum)),
                required: false,
                values: '',
            }),
            expect: [
                'hi',
                TestEnum.First,
                TestEnum.Second,
                TestEnum.Third,
            ],
        },
    ]);
});

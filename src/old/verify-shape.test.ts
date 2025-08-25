import {assert} from '@augment-vir/assert';
import {
    type AnyFunction,
    type ArrayElement,
    randomInteger,
    randomString,
} from '@augment-vir/common';
import {type FunctionTestCase, describe, it, itCases} from '@augment-vir/test';
import {FormatRegistry, Type} from '@sinclair/typebox';
import {TypeCompiler} from '@sinclair/typebox/compiler';
import {uuidShape} from '../custom-specifiers/custom-string-shapes.js';
import {defineShape} from '../define-shape/define-shape.js';
import {
    and,
    classShape,
    enumShape,
    exact,
    indexedKeys,
    numericRange,
    optional,
    or,
    tupleShape,
    unknownShape,
} from '../define-shape/shape-specifiers.js';
import {ShapeMismatchError} from '../errors/shape-mismatch.error.js';
import {
    assertValidShape,
    assertWrapValidShape,
    checkWrapValidShape,
    expandIndexedKeysKeys,
    isValidShape,
    matchesShape,
} from './verify-shape.js';

const sharedRegExp = /shared/;

enum SharedEnum {
    First = 'first with long value',
    Second = 'second with long value',
}

const testCases: ReadonlyArray<FunctionTestCase<typeof assertValidShape>> = [
    {
        it: 'passes a primitive string',
        inputs: [
            'hello there',
            defineShape(''),
        ],
        throws: undefined,
    },
    {
        it: 'passes a tuple',
        inputs: [
            [
                '',
                'yo',
                'hi',
            ],
            defineShape(tupleShape('', '', exact('hi'))),
        ],
        throws: undefined,
    },
    {
        it: 'rejects an invalid tuple',
        inputs: [
            [
                '',
                -1,
                'hi',
            ],
            defineShape(tupleShape('', '', exact('hi'))),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'rejects a non-array tuple',
        inputs: [
            'hi',
            defineShape(tupleShape('', '', exact('hi'))),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'passes an exact string',
        inputs: [
            'hello there',
            defineShape(exact('hello there')),
        ],
        throws: undefined,
    },
    {
        it: 'fails an exact string mismatch',
        inputs: [
            'yo',
            defineShape(exact('hello there')),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'passes a bare object',
        inputs: [
            {
                a: 'what',
                b: 4,
                c: /this is a regexp/,
            },
            defineShape({
                a: '',
                b: 0,
                c: new RegExp('f'),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'succeeds with a valid exact RegExp test',
        inputs: [
            {
                a: 'what',
                b: 4,
                c: sharedRegExp,
            },
            defineShape({
                a: '',
                b: 0,
                c: exact(sharedRegExp),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'matches a missing optional property',
        inputs: [
            {
                a: 'hi',
            },
            defineShape({
                a: '',
                b: optional(-1),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'matches an existing optional property',
        inputs: [
            {
                a: 'hi',
                b: 10,
            },
            defineShape({
                a: '',
                b: optional(-1),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'rejects an invalid existing optional property',
        inputs: [
            {
                a: 'hi',
                b: 'bye',
            },
            defineShape({
                a: '',
                b: optional(-1),
            }),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'matches a shape inside an optional property',
        inputs: [
            {
                a: 'hi',
                b: 'bye',
            },
            defineShape({
                a: '',
                b: optional(or(-1, '')),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'matches an object inside an optional property',
        inputs: [
            {
                a: 'hi',
                b: {
                    hi: 'bye',
                },
            },
            defineShape({
                a: '',
                b: optional({
                    hi: '',
                }),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'rejects an invalid object inside an optional property',
        inputs: [
            {
                a: 'hi',
                b: {
                    hi: -1,
                },
            },
            defineShape({
                a: '',
                b: optional({
                    hi: '',
                }),
            }),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'matches valid numeric range',
        inputs: [
            5,
            defineShape(numericRange(1, 10)),
        ],
        throws: undefined,
    },
    {
        it: 'rejects non-number numeric range',
        inputs: [
            {hi: 'hi'},
            defineShape(numericRange(1, 10)),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'rejects invalid numeric range',
        inputs: [
            11,
            defineShape(numericRange(1, 10)),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'fails if the input subject has a specifier',
        inputs: [
            {
                a: exact('what'),
            },
            defineShape({
                a: exact('what'),
            }),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'passes an object with specifiers',
        inputs: [
            {
                a: 'what',
                b: '',
                c: {a: 0, b: ''},
            },
            defineShape({
                a: 'what',
                b: or('', 0),
                c: and({a: 0}, {b: ''}),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'passes with a nested array',
        inputs: [
            {
                a: 'what',
                b: [
                    'a',
                    'b',
                    'c',
                ],
                c: {a: 0, b: ''},
            },
            defineShape({
                a: 'what',
                b: [''],
                c: and({a: 0}, {b: ''}),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'fails if any keys were not tested',
        inputs: [
            {
                a: 0,
                b: '',
                c: '',
            },
            defineShape(and({a: 0}, {b: ''})),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'works with enum shapes',
        inputs: [
            {
                a: 'big key',
                b: 42,
                c: SharedEnum.First,
            },
            defineShape({
                a: '',
                b: 0,
                c: enumShape(SharedEnum),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'accepts anything for unknownShape',
        inputs: [
            {
                a: 'big key',
                b: 42,
                c: SharedEnum.First,
            },
            defineShape({
                a: unknownShape(),
                b: unknownShape(),
                c: unknownShape(),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'accepts missing keys if their shape is undefined',
        inputs: [
            {
                c: null,
            },
            defineShape({
                a: undefined,
                b: or('', undefined),
                c: null,
            }),
        ],
        throws: undefined,
    },
    {
        it: 'does not allow null for objects',
        inputs: [
            null,
            /** `observableBaseShape` from the package `observavir`. */
            defineShape({
                listen(fireImmediately: boolean, callback: AnyFunction): any {
                    return () => false;
                },
                destroy() {},
                removeListener(listener: AnyFunction): boolean {
                    return false;
                },
                value: unknownShape(),
            }),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'allows null prototype objects',
        inputs: [
            Object.assign(Object.create(null), {
                a: 'hello',
            }),
            defineShape({
                a: '',
            }),
        ],
        throws: undefined,
    },
    {
        it: 'works with nested specifiers',
        inputs: [
            {
                a: {what: 'who'},
                b: 'hello there',
                c: 4321,
            },
            defineShape({
                a: exact({
                    what: 'who',
                }),
                b: or(0, exact('hello there')),
                c: or(0, exact('hello there')),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'does not allow missing keys for null shapes',
        inputs: [
            {},
            defineShape({
                a: undefined,
                b: or('', undefined),
                c: null,
            }),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'allows extra keys when set in options',
        inputs: [
            {a: undefined, b: '', c: null, d: 'lol extra stuff'},
            defineShape({
                a: undefined,
                b: or('', undefined),
                c: null,
            }),
            {allowExtraKeys: true},
        ],
        throws: undefined,
    },
    {
        it: 'fails on invalid or strings',
        inputs: [
            {b: false},
            defineShape({
                b: or('', 4),
            }),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'accepts anything for unknownShape at the top level',
        inputs: [
            {
                a: 'big key',
                b: 42,
                c: SharedEnum.First,
            },
            defineShape(unknownShape()),
        ],
        throws: undefined,
    },
    {
        it: 'fails when comparing an enum with an object',
        inputs: [
            {
                a: 'big key',
                b: 42,
                c: {
                    a: 'five',
                },
            },
            defineShape({
                a: '',
                b: 0,
                c: enumShape(SharedEnum),
            }),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'fails if extra keys exist',
        inputs: [
            {
                a: 0,
                b: '',
                c: '',
            },
            defineShape(or({a: 0}, {b: ''})),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'fails with an invalid array',
        inputs: [
            [
                0,
                'five',
            ],
            defineShape(['']),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'passes with an top-level array',
        inputs: [
            [
                'hi',
                'five',
            ],
            defineShape(['']),
        ],
        throws: undefined,
    },
    {
        it: 'fails an object with mismatched specifiers',
        inputs: [
            {
                a: 'what',
                b: '',
                c: {a: 0, c: ''},
            },
            defineShape({
                a: 'what',
                b: or('', 0),
                c: and({a: 0}, {b: ''}),
            }),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'fails an object with mismatched specifiers',
        inputs: [
            {
                a: 'what',
                b: '',
            },
            defineShape(and({a: ''}, {c: -1})),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'fails an incorrect and',
        inputs: [
            {
                a: 'what',
                b: '',
                c: {a: 0, c: ''},
            },
            defineShape({
                a: 'what',
                b: or('', 0),
                c: and({a: 0}, {b: ''}),
            }),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'accepts a valid class instance',
        inputs: [
            {
                a: new Error(),
                b: '',
            },
            defineShape({
                a: classShape(Error),
                b: or('', 0),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'accepts methods',
        inputs: [
            {
                myData: 'some string',
                /**
                 * Just any method will work because we can't check run-time types of a function
                 * beyond checking that it is a function.
                 */
                myMethod: () => {},
            },
            defineShape({
                myData: 'a',
                myMethod: (input1: string, input2: number): string => {
                    return [
                        input1,
                        input2,
                    ].join(': ');
                },
            }),
        ],
        throws: undefined,
    },
    {
        it: 'rejects an object assigned to a method',
        inputs: [
            {
                myData: 'some string',
                myMethod: {},
            },
            defineShape({
                myData: 'a',
                myMethod: (input1: string, input2: number): string => {
                    return [
                        input1,
                        input2,
                    ].join(': ');
                },
            }),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'rejects a number assigned to a method',
        inputs: [
            {
                myData: 'some string',
                myMethod: 5,
            },
            defineShape({
                myData: 'a',
                myMethod: (input1: string, input2: number): string => {
                    return [
                        input1,
                        input2,
                    ].join(': ');
                },
            }),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
];

describe(assertValidShape.name, () => {
    itCases(assertValidShape, testCases);

    describe('with default values', () => {
        itCases(
            assertValidShape,
            testCases.map((testCase): ArrayElement<typeof testCases> => {
                return {
                    it: testCase.it,
                    inputs: [
                        testCase.inputs[1].defaultValue,
                        testCase.inputs[1],
                    ],
                    throws: undefined,
                };
            }),
        );

        it('prepends custom message', () => {
            assert.throws(
                () =>
                    assertValidShape(
                        {
                            hour: 0,
                            minute: 0,
                            second: 0,
                        },
                        defineShape({hi: ''}),
                        {},
                        'oh no this failed',
                    ),
                {matchMessage: 'oh no this failed'},
            );
        });

        it('works on multi-and shape', () => {
            /** These types are copied out of the date-vir package */
            const timezoneShape = defineShape({
                ianaName: 'utc',
            });
            const timeOnlyUnitsShape = defineShape({
                hour: 0,
                minute: 0,
                second: 0,
            });
            const dateOnlyUnitsShape = defineShape({
                year: 0,
                month: 0,
                day: 0,
            });

            const fullDateShape = defineShape(
                and(dateOnlyUnitsShape, timeOnlyUnitsShape, {
                    timezone: timezoneShape,
                }),
            );

            assertValidShape(fullDateShape.defaultValue, fullDateShape);
        });
    });

    it('supports nested shapes', () => {
        const lowerLevelShape = defineShape({
            example: {
                first: 'hello',
                second: 42,
            },
        });

        const shapeWithNested = defineShape({
            stringProp: '',
            andProp: and({hi: ''}, {bye: ''}),
            nestedShape: or(lowerLevelShape),
            exactProp: exact('derp'),
        });

        assert.tsType<(typeof shapeWithNested)['runtimeType']>().equals<{
            stringProp: string;
            andProp: {
                hi: string;
            } & {
                bye: string;
            };
            nestedShape: {
                example: {
                    first: string;
                    second: number;
                };
            };
            exactProp: 'derp';
        }>();

        const exampleInstance: (typeof shapeWithNested)['runtimeType'] = {
            stringProp: 'yo',
            andProp: {hi: 'hello', bye: 'good bye'},
            nestedShape: {
                example: {
                    first: 'a string',
                    second: 0,
                },
            },
            exactProp: 'derp',
        };

        assertValidShape(exampleInstance, shapeWithNested);

        const assignmentAfterAssert: typeof shapeWithNested.runtimeType = exampleInstance;

        const assignmentWithIsValidShape: typeof shapeWithNested.runtimeType | undefined =
            isValidShape(exampleInstance, shapeWithNested) ? exampleInstance : undefined;
    });

    it('works with partial indexedKeys shapes', () => {
        assertValidShape(
            {
                stuff: 'hello there',
                moreStuff: {
                    derp: 0,
                },
            },
            defineShape({
                stuff: '',
                moreStuff: indexedKeys({
                    keys: '',
                    values: 0,
                    required: false,
                }),
            }),
        );
        assert.throws(() =>
            assertValidShape(
                {
                    stuff: 'hello there',
                    moreStuff: {
                        derp: 0,
                    },
                },
                defineShape({
                    stuff: '',
                    moreStuff: indexedKeys({
                        keys: exact('hi'),
                        values: 0,
                        required: false,
                    }),
                }),
            ),
        );
        assertValidShape(
            {
                stuff: 'hello there',
                moreStuff: {
                    hi: 0,
                },
            },
            defineShape({
                stuff: '',
                moreStuff: indexedKeys({
                    keys: exact('hi'),
                    values: 0,
                    required: false,
                }),
            }),
        );
    });

    it('works with UUID indexed keys', () => {
        assertValidShape(
            {
                '23f3eef2-682d-4a78-afda-129006318cdf': {
                    roomId: '23f3eef2-682d-4a78-afda-129006318cdf',
                    roomName: 'Room A',
                    clientCount: 2,
                },
            },
            defineShape(
                indexedKeys({
                    keys: uuidShape,
                    values: defineShape({
                        roomName: '',
                        roomId: uuidShape,
                        clientCount: -1,
                    }),
                    required: false,
                }),
            ),
            {
                allowExtraKeys: true,
            },
        );
        assert.throws(() =>
            assertValidShape(
                {
                    fff: {
                        roomId: '23f3eef2-682d-4a78-afda-129006318cdf',
                        roomName: 'Room A',
                        clientCount: 2,
                    },
                },
                defineShape(
                    indexedKeys({
                        keys: uuidShape,
                        values: defineShape({
                            roomName: '',
                            roomId: uuidShape,
                            clientCount: -1,
                        }),
                        required: false,
                    }),
                ),
                {
                    allowExtraKeys: true,
                },
            ),
        );
        assertValidShape(
            {
                '23f3eef2-682d-4a78-afda-129006318cdf': {
                    roomId: '23f3eef2-682d-4a78-afda-129006318cdf',
                    roomName: 'Room A',
                    clientCount: 2,
                },
            },
            defineShape(
                indexedKeys({
                    keys: uuidShape,
                    values: defineShape({
                        roomName: '',
                        roomId: uuidShape,
                        clientCount: -1,
                    }),
                    required: false,
                }),
            ),
        );
    });

    it('works with required indexedKeys shapes', () => {
        assertValidShape(
            {
                stuff: 'hello there',
                moreStuff: {
                    hi: 0,
                },
            },
            defineShape({
                stuff: '',
                moreStuff: indexedKeys({
                    keys: exact('hi'),
                    values: 0,
                    required: true,
                }),
            }),
        );
        assertValidShape(
            {
                stuff: 'hello there',
                moreStuff: {
                    [SharedEnum.First]: 42,
                    [SharedEnum.Second]: -1,
                },
            },
            defineShape({
                stuff: '',
                moreStuff: indexedKeys({
                    keys: enumShape(SharedEnum),
                    values: 0,
                    required: true,
                }),
            }),
        );
        assertValidShape(
            {
                stuff: 'hello there',
                moreStuff: {
                    hi: 0,
                    bye: 1,
                },
            },
            defineShape({
                stuff: '',
                moreStuff: indexedKeys({
                    keys: or(exact('hi'), exact('bye')),
                    values: 0,
                    required: true,
                }),
            }),
        );
    });

    it('allows class instances to match objects', () => {
        assertValidShape(
            new RegExp('stuff'),
            defineShape({
                flags: '',
                source: '',
            }),
            {allowExtraKeys: true},
        );
    });

    it('rejects missing required indexedKeys shapes', () => {
        assertValidShape(
            {
                stuff: 'hello there',
                // does not require any keys
                moreStuff: {},
            },
            defineShape({
                stuff: '',
                moreStuff: indexedKeys({
                    keys: '',
                    values: 0,
                    required: true,
                }),
            }),
        );
        assert.throws(() =>
            assertValidShape(
                {
                    stuff: 'hello there',
                    moreStuff: {
                        /** Missing exact key. */
                        derp: 0,
                    },
                },
                defineShape({
                    stuff: '',
                    moreStuff: indexedKeys({
                        keys: exact('hi'),
                        values: 0,
                        required: true,
                    }),
                }),
            ),
        );
        assert.throws(() =>
            assertValidShape(
                {
                    stuff: 'hello there',
                    moreStuff: {
                        /** Missing all `SharedEnum` values. */
                        [SharedEnum.First]: 42,
                    },
                },
                defineShape({
                    stuff: '',
                    moreStuff: indexedKeys({
                        keys: enumShape(SharedEnum),
                        values: 0,
                        required: true,
                    }),
                }),
            ),
        );
        assert.throws(() =>
            assertValidShape(
                {
                    stuff: 'hello there',
                    moreStuff: {
                        hi: 0,
                    },
                },
                defineShape({
                    stuff: '',
                    moreStuff: indexedKeys({
                        keys: or(exact('hi'), exact('bye')),
                        values: 0,
                        required: true,
                    }),
                }),
            ),
        );
    });

    it('has proper types for a nested exact', () => {
        const myShape = defineShape({
            message: exact('hello'),
        });

        type MyType = typeof myShape.runtimeType;

        const instance = {} as any;

        const result: MyType | undefined = isValidShape(instance, myShape) ? instance : undefined;
    });

    it('allows optional properties', () => {
        const myShape = defineShape(
            or(
                {
                    prop1: '',
                    prop2: 2,
                },
                {
                    prop1: '',
                    prop2: 2,
                    prop3: or(undefined, ''),
                },
            ),
        );
        type MyShape = typeof myShape.runtimeType;

        const instance: MyShape = {
            prop1: 'hi',
            prop2: 3,
        };
        assertValidShape(instance, myShape);
    });

    it('allows readonly shapes', () => {
        const myShape = defineShape(
            or(
                {
                    prop1: '',
                    prop2: 2,
                },
                {
                    prop1: '',
                    prop2: 2,
                    prop3: or(undefined, ''),
                },
            ),
            true,
        );
        type MyShape = typeof myShape.runtimeType;

        const instance: MyShape = {
            prop1: 'hi',
            prop2: 3,
        };

        assertValidShape(instance, myShape);
    });

    it('works with complex or', () => {
        const result = {
            id: randomString(),
            message: 'Batch verification completed.',
            reason_counts: {
                rejected_email: 1,
                accepted_email: 4,
                invalid_domain: 0,
                invalid_email: 0,
                invalid_smtp: 0,
                low_deliverability: 0,
                low_quality: 0,
                no_connect: 0,
                timeout: 0,
                unavailable_smtp: 0,
                unexpected_error: 0,
            },
            total_counts: {
                deliverable: 4,
                undeliverable: 1,
                duplicate: 0,
                processed: 5,
                imported: 0,
                total: 5,
                risky: 0,
                unknown: 0,
            },
            emails: [
                {
                    email: randomString(),
                    state: 'deliverable',
                },
                {
                    email: randomString(),
                    state: 'deliverable',
                },
                {
                    email: randomString(),
                    state: 'deliverable',
                },
                {
                    email: randomString(),
                    state: 'deliverable',
                },
                {
                    email: randomString(),
                    state: 'undeliverable',
                },
            ],
        };

        enum VerificationStateEnum {
            Deliverable = 'deliverable',
            Undeliverable = 'undeliverable',
            Risky = 'risky',
            Unknown = 'unknown',
        }

        enum EmailBatchVerificationStatusMessageEnum {
            Completed = 'Batch verification completed.',
            InProgress = 'Your batch is being processed.',
        }

        const verificationResultInProgressShape = defineShape({
            message: exact(EmailBatchVerificationStatusMessageEnum.InProgress),
        });

        const verificationResultCompletedShape = defineShape({
            message: exact(EmailBatchVerificationStatusMessageEnum.Completed),
            emails: [
                {
                    email: '',
                    state: enumShape(VerificationStateEnum),
                },
            ],
        });

        const VerificationResultShape = defineShape(
            or(verificationResultInProgressShape, verificationResultCompletedShape),
        );

        assertValidShape(result, VerificationResultShape, {allowExtraKeys: true});

        assert.deepEquals(
            VerificationResultShape.defaultValue,
            verificationResultInProgressShape.defaultValue,
        );
    });

    it('error message includes whole key chain', () => {
        assert.throws(
            () => {
                assertValidShape(
                    {
                        top: {
                            second: {
                                third: {
                                    hi: [
                                        'valid',
                                        -1,
                                    ],
                                },
                            },
                        },
                    },
                    defineShape({
                        top: {
                            second: {
                                third: {
                                    hi: [''],
                                },
                            },
                        },
                    }),
                );
            },
            {
                matchMessage:
                    "Shape mismatch at top level -> 'top' -> 'second' -> 'third' -> 'hi' -> '1': -1 does not have the same type as  ''",
            },
        );
    });

    it('errors keys go into arrays', () => {
        assert.throws(
            () => {
                assertValidShape(
                    {
                        top: [
                            {
                                nested: 'hi',
                            },
                            {
                                nested: 'bye',
                            },
                            {
                                notNested: 'invalid',
                            },
                        ],
                    },
                    defineShape({
                        top: [
                            {
                                nested: '',
                            },
                        ],
                    }),
                );
            },
            {
                matchMessage: "Subject has extra key 'notNested' in top level -> 'top' -> '2'",
            },
        );
    });
});

describe(isValidShape.name, () => {
    const testCasesForIsValidCheck: ReadonlyArray<FunctionTestCase<typeof isValidShape>> =
        testCases.map((testCase: any): FunctionTestCase<typeof isValidShape> => {
            const newTestCase = {...testCase, expect: testCase.throws ? false : true};
            delete newTestCase.throws;
            return newTestCase;
        });
    itCases(isValidShape, testCasesForIsValidCheck);
});

describe(matchesShape.name, () => {
    itCases(matchesShape, [
        {
            it: 'always true for unknown specifier',
            inputs: [
                Math.random() > 0.5 ? '' : 4,
                unknownShape(),
                [],
                {exactValues: false, ignoreExtraKeys: false},
            ],
            expect: true,
        },
        {
            it: 'matches valid numeric range',
            inputs: [
                5,
                numericRange(1, 10),
                [],
                {exactValues: false, ignoreExtraKeys: false},
            ],
            expect: true,
        },
        {
            it: 'rejects non-number numeric range',
            inputs: [
                {hi: 'hi'},
                numericRange(1, 10),
                [],
                {exactValues: false, ignoreExtraKeys: false},
            ],
            expect: false,
        },
        {
            it: 'rejects invalid numeric range',
            inputs: [
                11,
                numericRange(1, 10),
                [],
                {exactValues: false, ignoreExtraKeys: false},
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
                [],
                {exactValues: false, ignoreExtraKeys: true},
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
                [],
                {exactValues: false, ignoreExtraKeys: false},
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
                [],
                {exactValues: false, ignoreExtraKeys: false},
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
                [],
                {exactValues: false, ignoreExtraKeys: false},
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
                [],
                {exactValues: false, ignoreExtraKeys: false},
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
                [],
                {exactValues: false, ignoreExtraKeys: false},
            ],
            expect: true,
        },
        {
            it: 'accepts a class instance',
            inputs: [
                new Error(),
                classShape(Error),
                [],
                {exactValues: false, ignoreExtraKeys: false},
            ],
            expect: true,
        },
        {
            it: 'rejects the wrong class instance',
            inputs: [
                new Error(),
                classShape(HTMLElement),
                [],
                {exactValues: false, ignoreExtraKeys: false},
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
                [],
                {exactValues: false, ignoreExtraKeys: false},
            ],
            expect: false,
        },
    ]);
});

enum TestEnum {
    First = 'first',
    Second = 'second',
    Third = 'third',
}

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

describe(checkWrapValidShape.name, () => {
    itCases(checkWrapValidShape, [
        {
            it: 'passes',
            inputs: [
                {a: 'hi'},
                defineShape({a: ''}),
            ],
            expect: {a: 'hi'},
        },
        {
            it: 'rejects',
            inputs: [
                {a: 3},
                defineShape({a: ''}),
            ],
            expect: undefined,
        },
    ]);
});

describe(assertWrapValidShape.name, () => {
    itCases(assertWrapValidShape, [
        {
            it: 'passes',
            inputs: [
                {a: 'hi'},
                defineShape({a: ''}),
            ],
            expect: {a: 'hi'},
        },
        {
            it: 'rejects',
            inputs: [
                {a: 3},
                defineShape({a: ''}),
            ],
            throws: {
                matchConstructor: ShapeMismatchError,
            },
        },
    ]);
});

// ========================================
// TypeBox equivalent tests
// ========================================

class TypeBoxValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TypeBoxValidationError';
    }
}

function assertValidTypeBox(data: unknown, schema: any): void {
    const validator = TypeCompiler.Compile(schema);
    if (!validator.Check(data)) {
        const errors = Array.from(validator.Errors(data));
        throw new TypeBoxValidationError(
            JSON.stringify(errors.map(({path, message}) => ({path, message}))),
        );
    }
}

// TypeBox equivalent of SharedEnum
enum TypeBoxSharedEnum {
    First = 'first with long value',
    Second = 'second with long value',
}

const typeBoxTestCases: ReadonlyArray<FunctionTestCase<typeof assertValidTypeBox>> = [
    {
        it: 'passes a primitive string',
        inputs: [
            'hello there',
            Type.String(),
        ],
        throws: undefined,
    },
    {
        it: 'passes a tuple',
        inputs: [
            [
                '',
                'yo',
                'hi',
            ],
            Type.Tuple([
                Type.String(),
                Type.String(),
                Type.Literal('hi'),
            ]),
        ],
        throws: undefined,
    },
    {
        it: 'rejects an invalid tuple',
        inputs: [
            [
                '',
                -1,
                'hi',
            ],
            Type.Tuple([
                Type.String(),
                Type.String(),
                Type.Literal('hi'),
            ]),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
    {
        it: 'rejects a non-array tuple',
        inputs: [
            'hi',
            Type.Tuple([
                Type.String(),
                Type.String(),
                Type.Literal('hi'),
            ]),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
    {
        it: 'passes an exact string',
        inputs: [
            'hello there',
            Type.Literal('hello there'),
        ],
        throws: undefined,
    },
    {
        it: 'fails an exact string mismatch',
        inputs: [
            'yo',
            Type.Literal('hello there'),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
    {
        it: 'passes a bare object',
        inputs: [
            {
                a: 'what',
                b: 4,
                c: /this is a regexp/,
            },
            Type.Object({
                a: Type.String(),
                b: Type.Number(),
                c: Type.Any(), // RegExp
            }),
        ],
        throws: undefined,
    },
    {
        it: 'succeeds with a valid exact RegExp test',
        inputs: [
            {
                a: 'what',
                b: 4,
                c: sharedRegExp,
            },
            Type.Object({
                a: Type.String(),
                b: Type.Number(),
                c: Type.Any(), // For exact RegExp match, we'd need custom validation
            }),
        ],
        throws: undefined,
    },
    {
        it: 'matches a missing optional property',
        inputs: [
            {
                a: 'hi',
            },
            Type.Object({
                a: Type.String(),
                b: Type.Optional(Type.Number()),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'matches an existing optional property',
        inputs: [
            {
                a: 'hi',
                b: 10,
            },
            Type.Object({
                a: Type.String(),
                b: Type.Optional(Type.Number()),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'rejects an invalid existing optional property',
        inputs: [
            {
                a: 'hi',
                b: 'bye',
            },
            Type.Object({
                a: Type.String(),
                b: Type.Optional(Type.Number()),
            }),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
    {
        it: 'matches a shape inside an optional property',
        inputs: [
            {
                a: 'hi',
                b: 'bye',
            },
            Type.Object({
                a: Type.String(),
                b: Type.Optional(
                    Type.Union([
                        Type.Number(),
                        Type.String(),
                    ]),
                ),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'matches an object inside an optional property',
        inputs: [
            {
                a: 'hi',
                b: {
                    hi: 'bye',
                },
            },
            Type.Object({
                a: Type.String(),
                b: Type.Optional(
                    Type.Object({
                        hi: Type.String(),
                    }),
                ),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'rejects an invalid object inside an optional property',
        inputs: [
            {
                a: 'hi',
                b: {
                    hi: -1,
                },
            },
            Type.Object({
                a: Type.String(),
                b: Type.Optional(
                    Type.Object({
                        hi: Type.String(),
                    }),
                ),
            }),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
    {
        it: 'matches valid numeric range',
        inputs: [
            5,
            Type.Number({minimum: 1, maximum: 10}),
        ],
        throws: undefined,
    },
    {
        it: 'rejects non-number numeric range',
        inputs: [
            {hi: 'hi'},
            Type.Number({minimum: 1, maximum: 10}),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
    {
        it: 'rejects invalid numeric range',
        inputs: [
            11,
            Type.Number({minimum: 1, maximum: 10}),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
    {
        it: 'passes an object with union types',
        inputs: [
            {
                a: 'what',
                b: '',
                c: {a: 0, b: ''},
            },
            Type.Object({
                a: Type.String(),
                b: Type.Union([
                    Type.String(),
                    Type.Number(),
                ]),
                c: Type.Intersect([
                    Type.Object({a: Type.Number()}),
                    Type.Object({b: Type.String()}),
                ]),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'passes with a nested array',
        inputs: [
            {
                a: 'what',
                b: [
                    'a',
                    'b',
                    'c',
                ],
                c: {a: 0, b: ''},
            },
            Type.Object({
                a: Type.String(),
                b: Type.Array(Type.String()),
                c: Type.Intersect([
                    Type.Object({a: Type.Number()}),
                    Type.Object({b: Type.String()}),
                ]),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'works with enum shapes',
        inputs: [
            {
                a: 'big key',
                b: 42,
                c: TypeBoxSharedEnum.First,
            },
            Type.Object({
                a: Type.String(),
                b: Type.Number(),
                c: Type.Enum(TypeBoxSharedEnum),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'accepts anything for unknown type',
        inputs: [
            {
                a: 'big key',
                b: 42,
                c: TypeBoxSharedEnum.First,
            },
            Type.Object({
                a: Type.Unknown(),
                b: Type.Unknown(),
                c: Type.Unknown(),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'accepts missing keys with undefined union',
        inputs: [
            {
                c: null,
            },
            Type.Object({
                a: Type.Optional(Type.Undefined()),
                b: Type.Optional(
                    Type.Union([
                        Type.String(),
                        Type.Undefined(),
                    ]),
                ),
                c: Type.Null(),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'does not allow null for objects',
        inputs: [
            null,
            Type.Object({
                listen: Type.Function([], Type.Any()),
                destroy: Type.Function([], Type.Void()),
                removeListener: Type.Function([Type.Any()], Type.Boolean()),
                value: Type.Unknown(),
            }),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
    {
        it: 'works with nested exact values',
        inputs: [
            {
                a: {what: 'who'},
                b: 'hello there',
                c: 4321,
            },
            Type.Object({
                a: Type.Object({what: Type.Literal('who')}),
                b: Type.Union([
                    Type.Number(),
                    Type.Literal('hello there'),
                ]),
                c: Type.Union([
                    Type.Number(),
                    Type.Literal('hello there'),
                ]),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'fails on invalid union strings',
        inputs: [
            {b: false},
            Type.Object({
                b: Type.Union([
                    Type.String(),
                    Type.Number(),
                ]),
            }),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
    {
        it: 'accepts anything for unknown at the top level',
        inputs: [
            {
                a: 'big key',
                b: 42,
                c: TypeBoxSharedEnum.First,
            },
            Type.Unknown(),
        ],
        throws: undefined,
    },
    {
        it: 'fails when comparing an enum with an object',
        inputs: [
            {
                a: 'big key',
                b: 42,
                c: {
                    a: 'five',
                },
            },
            Type.Object({
                a: Type.String(),
                b: Type.Number(),
                c: Type.Enum(TypeBoxSharedEnum),
            }),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
    {
        it: 'fails with an invalid array',
        inputs: [
            [
                0,
                'five',
            ],
            Type.Array(Type.String()),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
    {
        it: 'passes with a top-level array',
        inputs: [
            [
                'hi',
                'five',
            ],
            Type.Array(Type.String()),
        ],
        throws: undefined,
    },
    {
        it: 'accepts a valid class instance (using Any type)',
        inputs: [
            {
                a: new Error(),
                b: '',
            },
            Type.Object({
                a: Type.Any(), // TypeBox doesn't have direct class validation like classShape
                b: Type.Union([
                    Type.String(),
                    Type.Number(),
                ]),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'accepts methods (functions)',
        inputs: [
            {
                myData: 'some string',
                myMethod: () => {},
            },
            Type.Object({
                myData: Type.String(),
                myMethod: Type.Function([], Type.Any()),
            }),
        ],
        throws: undefined,
    },
    {
        it: 'rejects an object assigned to a method',
        inputs: [
            {
                myData: 'some string',
                myMethod: {},
            },
            Type.Object({
                myData: Type.String(),
                myMethod: Type.Function([], Type.Any()),
            }),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
    {
        it: 'rejects a number assigned to a method',
        inputs: [
            {
                myData: 'some string',
                myMethod: 5,
            },
            Type.Object({
                myData: Type.String(),
                myMethod: Type.Function([], Type.Any()),
            }),
        ],
        throws: {
            matchConstructor: TypeBoxValidationError,
        },
    },
];

describe('TypeBox validation tests', () => {
    itCases(assertValidTypeBox, typeBoxTestCases);

    it('supports nested schemas', () => {
        const lowerLevelShape = Type.Object({
            example: Type.Object({
                first: Type.String(),
                second: Type.Number(),
            }),
        });

        const shapeWithNested = Type.Object({
            stringProp: Type.String(),
            andProp: Type.Intersect([
                Type.Object({hi: Type.String()}),
                Type.Object({bye: Type.String()}),
            ]),
            nestedShape: lowerLevelShape,
            exactProp: Type.Literal('derp'),
        });

        const exampleInstance = {
            stringProp: 'yo',
            andProp: {hi: 'hello', bye: 'good bye'},
            nestedShape: {
                example: {
                    first: 'a string',
                    second: 0,
                },
            },
            exactProp: 'derp' as const,
        };

        assertValidTypeBox(exampleInstance, shapeWithNested);
    });

    it('works with partial record-like shapes', () => {
        assertValidTypeBox(
            {
                stuff: 'hello there',
                moreStuff: {
                    derp: 0,
                },
            },
            Type.Object({
                stuff: Type.String(),
                moreStuff: Type.Record(Type.String(), Type.Number()),
            }),
        );

        assert.throws(() =>
            assertValidTypeBox(
                {
                    stuff: 'hello there',
                    moreStuff: {
                        derp: 0,
                    },
                },
                Type.Object({
                    stuff: Type.String(),
                    moreStuff: Type.Record(Type.Literal('hi'), Type.Number()),
                }),
            ),
        );

        assertValidTypeBox(
            {
                stuff: 'hello there',
                moreStuff: {
                    hi: 0,
                },
            },
            Type.Object({
                stuff: Type.String(),
                moreStuff: Type.Record(Type.Literal('hi'), Type.Number()),
            }),
        );
    });

    it('works with UUID-like patterns', () => {
        const Uuid = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

        /**
         * `[ajv-formats]` A Universally Unique Identifier as defined by [RFC
         * 4122](https://datatracker.ietf.org/doc/html/rfc4122).
         *
         * @example `9aa8a673-8590-4db2-9830-01755844f7c1`
         */
        function IsUuid(value: string): boolean {
            return Uuid.test(value);
        }
        FormatRegistry.Set('uuid', (value) => IsUuid(value));

        assertValidTypeBox(
            {
                '23f3eef2-682d-4a78-afda-129006318cdf': {
                    roomId: '23f3eef2-682d-4a78-afda-129006318cdf',
                    roomName: 'Room A',
                    clientCount: 2,
                },
            },
            Type.Record(
                Type.String({format: 'uuid'}),
                Type.Object({
                    roomName: Type.String(),
                    roomId: Type.String({format: 'uuid'}),
                    clientCount: Type.Number(),
                }),
            ),
        );

        assert.throws(() => {
            assertValidTypeBox('fffff', Type.String({format: 'uuid'}));
        });

        assert.throws(() =>
            assertValidTypeBox(
                {
                    fff: {
                        roomId: '23f3eef2-682d-4a78-afda-129006318cdf',
                        roomName: 'Room A',
                        clientCount: 2,
                    },
                },
                Type.Record(
                    Type.String({format: 'uuid'}),
                    Type.Object({
                        roomName: Type.String(),
                        roomId: Type.String({format: 'uuid'}),
                        clientCount: Type.Number(),
                    }),
                ),
            ),
        );
    });

    it('allows extra properties with additionalProperties', () => {
        assertValidTypeBox(
            new RegExp('stuff'),
            Type.Object(
                {
                    flags: Type.String(),
                    source: Type.String(),
                },
                {additionalProperties: true},
            ),
        );
    });

    it('allows optional properties', () => {
        const myShape = Type.Union([
            Type.Object({
                prop1: Type.String(),
                prop2: Type.Number(),
            }),
            Type.Object({
                prop1: Type.String(),
                prop2: Type.Number(),
                prop3: Type.Optional(Type.String()),
            }),
        ]);

        const instance = {
            prop1: 'hi',
            prop2: 3,
        };
        assertValidTypeBox(instance, myShape);
    });

    it('works with complex union', () => {
        enum VerificationStateEnum {
            Deliverable = 'deliverable',
            Undeliverable = 'undeliverable',
            Risky = 'risky',
            Unknown = 'unknown',
        }

        enum EmailBatchVerificationStatusMessageEnum {
            Completed = 'Batch verification completed.',
            InProgress = 'Your batch is being processed.',
        }

        const verificationResultInProgressShape = Type.Object({
            message: Type.Literal(EmailBatchVerificationStatusMessageEnum.InProgress),
        });

        const verificationResultCompletedShape = Type.Object({
            message: Type.Literal(EmailBatchVerificationStatusMessageEnum.Completed),
            emails: Type.Array(
                Type.Object({
                    email: Type.String(),
                    state: Type.Enum(VerificationStateEnum),
                }),
            ),
        });

        const VerificationResultShape = Type.Union([
            verificationResultInProgressShape,
            verificationResultCompletedShape,
        ]);

        const result = {
            id: randomString(),
            message: 'Batch verification completed.',
            reason_counts: {
                rejected_email: 1,
                accepted_email: 4,
                invalid_domain: 0,
                invalid_email: 0,
                invalid_smtp: 0,
                low_deliverability: 0,
                low_quality: 0,
                no_connect: 0,
                timeout: 0,
                unavailable_smtp: 0,
                unexpected_error: 0,
            },
            total_counts: {
                deliverable: 4,
                undeliverable: 1,
                duplicate: 0,
                processed: 5,
                imported: 0,
                total: 5,
                risky: 0,
                unknown: 0,
            },
            emails: [
                {
                    email: randomString(),
                    state: 'deliverable',
                },
                {
                    email: randomString(),
                    state: 'deliverable',
                },
                {
                    email: randomString(),
                    state: 'deliverable',
                },
                {
                    email: randomString(),
                    state: 'deliverable',
                },
                {
                    email: randomString(),
                    state: 'undeliverable',
                },
            ],
        };

        // Test with additional properties allowed
        const VerificationResultShapeWithExtras = Type.Intersect([
            VerificationResultShape,
            Type.Object({}, {additionalProperties: true}),
        ]);

        assertValidTypeBox(result, VerificationResultShapeWithExtras);
    });

    it('error message includes validation details', () => {
        assert.throws(
            () => {
                assertValidTypeBox(
                    {
                        top: {
                            second: {
                                third: {
                                    hi: [
                                        'valid',
                                        -1,
                                    ],
                                },
                            },
                        },
                    },
                    Type.Object({
                        top: Type.Object({
                            second: Type.Object({
                                third: Type.Object({
                                    hi: Type.Array(Type.String()),
                                }),
                            }),
                        }),
                    }),
                );
            },
            {
                matchConstructor: TypeBoxValidationError,
            },
        );
    });

    it('errors on array validation', () => {
        assert.throws(
            () => {
                assertValidTypeBox(
                    {
                        top: [
                            {
                                nested: 'hi',
                            },
                            {
                                nested: 'bye',
                            },
                            {
                                notNested: 'invalid',
                            },
                        ],
                    },
                    Type.Object({
                        top: Type.Array(
                            Type.Object({
                                nested: Type.String(),
                            }),
                        ),
                    }),
                );
            },
            {
                matchConstructor: TypeBoxValidationError,
            },
        );
    });
});

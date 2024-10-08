import {assert} from '@augment-vir/assert';
import type {ArrayElement} from '@augment-vir/common';
import {randomString} from '@augment-vir/common';
import {FunctionTestCase, describe, it, itCases} from '@augment-vir/test';
import {defineShape} from '../define-shape/define-shape.js';
import {
    and,
    classShape,
    enumShape,
    exact,
    indexedKeys,
    or,
    unknownShape,
} from '../define-shape/shape-specifiers.js';
import {ShapeMismatchError} from '../errors/shape-mismatch.error.js';
import {assertValidShape, isValidShape} from './verify-shape.js';

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
                    ...testCase,
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
        assert.throws(
            () =>
                assertValidShape(
                    {
                        stuff: 'hello there',
                        /** Needs at least one key */
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
                ),
            undefined,
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
                    "Subject does not match shape definition at key top level -> 'top' -> 'second' -> 'third' -> 'hi' -> '1'",
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

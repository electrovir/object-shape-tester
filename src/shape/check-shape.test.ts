import {assert, type ErrorMatchOptions} from '@augment-vir/assert';
import {
    omitObjectKeys,
    randomString,
    type AnyFunction,
    type ArrayElement,
} from '@augment-vir/common';
import {describe, it, itCases, type FunctionTestCase} from '@augment-vir/test';
import {Type} from '@sinclair/typebox';
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
import {ShapeMismatchError} from '../errors/shape-mismatch.error.js';
import {defineShape, type Shape} from '../shape/shape.js';
import {
    assertValidShape,
    assertWrapValidShape,
    checkValidShape,
    checkWrapValidShape,
    type CheckShapeOptions,
} from './check-shape.js';

const mockSymbol = Symbol('mock symbol');

const sharedRegExp = /shared/;

enum SharedEnum {
    First = 'first with long value',
    Second = 'second with long value',
}

const testCases: ReadonlyArray<
    Readonly<{
        it: string;
        only?: true;
        inputs: [
            unknown,
            Shape,
            CheckShapeOptions?,
        ];
        throws: ErrorMatchOptions | undefined;
    }>
> = [
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
            defineShape(tupleShape('', '', exactShape('hi'))),
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
            defineShape(tupleShape('', '', exactShape('hi'))),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'rejects a non-array tuple',
        inputs: [
            'hi',
            defineShape(tupleShape('', '', exactShape('hi'))),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'passes an exact string',
        inputs: [
            'hello there',
            defineShape(exactShape('hello there')),
        ],
        throws: undefined,
    },
    {
        it: 'fails an exact string mismatch',
        inputs: [
            'yo',
            defineShape(exactShape('hello there')),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'passes a basic object',
        inputs: [
            {
                a: 'what',
                b: 4,
                c: /this is a regexp/,
            },
            defineShape({
                a: '',
                b: 0,
                c: classShape(RegExp),
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
                c: exactShape(sharedRegExp),
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
                b: optionalShape(-1),
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
                b: optionalShape(-1),
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
                b: optionalShape(-1),
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
                b: optionalShape(unionShape(-1, '')),
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
                b: optionalShape({
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
                b: optionalShape({
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
            defineShape(
                rangeShape({
                    min: 1,
                    max: 10,
                }),
            ),
        ],
        throws: undefined,
    },
    {
        it: 'rejects non-number numeric range',
        inputs: [
            {
                hi: 'hi',
            },
            defineShape(
                rangeShape({
                    min: 1,
                    max: 10,
                }),
            ),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'rejects invalid numeric range',
        inputs: [
            11,
            defineShape(
                rangeShape({
                    min: 1,
                    max: 10,
                }),
            ),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'fails if the input subject has a specifier',
        inputs: [
            {
                a: exactShape('what'),
            },
            defineShape({
                a: exactShape('what'),
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
                c: {
                    a: 0,
                    b: '',
                },
            },
            defineShape({
                a: 'what',
                b: unionShape('', 0),
                c: intersectShape(
                    {
                        a: 0,
                    },
                    {
                        b: '',
                    },
                ),
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
                c: {
                    a: 0,
                    b: '',
                },
            },
            defineShape({
                a: 'what',
                b: [''],
                c: intersectShape(
                    {
                        a: 0,
                    },
                    {
                        b: '',
                    },
                ),
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
            defineShape(
                intersectShape(
                    {
                        a: 0,
                    },
                    {
                        b: '',
                    },
                ),
            ),
            {
                allowExtraKeys: false,
            },
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
        it: 'rejects missing keys even if their value shapes are undefined',
        inputs: [
            {
                c: null,
            },
            defineShape({
                a: undefined,
                b: unionShape('', undefined),
                c: null,
            }),
        ],
        throws: {
            matchMessage: 'expected required property',
        },
    },
    {
        it: 'allows missing optional keys',
        inputs: [
            {
                c: null,
            },
            defineShape({
                a: optionalShape(undefined),
                b: optionalShape(unionShape('', undefined)),
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
                a: {
                    what: 'who',
                },
                b: 'hello there',
                c: 4321,
            },
            defineShape({
                a: exactShape({
                    what: 'who',
                }),
                b: unionShape(0, exactShape('hello there')),
                c: unionShape(0, exactShape('hello there')),
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
                b: unionShape('', undefined),
                c: null,
            }),
        ],
        throws: {
            matchConstructor: ShapeMismatchError,
        },
    },
    {
        it: 'fails on invalid or strings',
        inputs: [
            {
                b: false,
            },
            defineShape({
                b: unionShape('', 4),
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
            defineShape(
                unionShape(
                    {
                        a: 0,
                    },
                    {
                        b: '',
                    },
                ),
            ),
            {
                allowExtraKeys: false,
            },
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
                c: {
                    a: 0,
                    c: '',
                },
            },
            defineShape({
                a: 'what',
                b: unionShape('', 0),
                c: intersectShape(
                    {
                        a: 0,
                    },
                    {
                        b: '',
                    },
                ),
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
            defineShape(
                intersectShape(
                    {
                        a: '',
                    },
                    {
                        c: -1,
                    },
                ),
            ),
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
                c: {
                    a: 0,
                    c: '',
                },
            },
            defineShape({
                a: 'what',
                b: unionShape('', 0),
                c: intersectShape(
                    {
                        a: 0,
                    },
                    {
                        b: '',
                    },
                ),
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
                b: unionShape('', 0),
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
] satisfies ReadonlyArray<FunctionTestCase<typeof assertValidShape>>;

describe(assertValidShape.name, () => {
    itCases(assertValidShape, testCases);

    describe('with default values', () => {
        itCases(
            assertValidShape,
            testCases.map((testCase): ArrayElement<typeof testCases> => {
                return {
                    it: testCase.it,
                    inputs: [
                        testCase.inputs[1].default as unknown,
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
                        defineShape({
                            hi: '',
                        }),
                        {},
                        'oh no this failed',
                    ),
                {
                    matchMessage: 'oh no this failed',
                },
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
                intersectShape(dateOnlyUnitsShape, timeOnlyUnitsShape, {
                    timezone: timezoneShape,
                }),
            );

            assertValidShape(fullDateShape.default, fullDateShape);
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
            andProp: intersectShape(
                {
                    hi: '',
                },
                {
                    bye: '',
                },
            ),
            nestedShape: unionShape(lowerLevelShape),
            exactProp: exactShape('derp'),
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
            andProp: {
                hi: 'hello',
                bye: 'good bye',
            },
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
            checkValidShape(exampleInstance, shapeWithNested) ? exampleInstance : undefined;
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
                moreStuff: recordShape({
                    keys: '',
                    values: 0,
                    partial: true,
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
                    moreStuff: recordShape({
                        keys: exactShape('hi'),
                        values: 0,
                        partial: true,
                    }),
                }),
                {
                    preventExtraKeys: true,
                },
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
                moreStuff: recordShape({
                    keys: exactShape('hi'),
                    values: 0,
                    partial: true,
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
                recordShape({
                    keys: uuidShape(),
                    values: defineShape({
                        roomName: '',
                        roomId: uuidShape(),
                        clientCount: -1,
                    }),
                    partial: true,
                }),
            ),
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
                    recordShape({
                        keys: uuidShape(),
                        values: defineShape({
                            roomName: '',
                            roomId: uuidShape(),
                            clientCount: -1,
                        }),
                        partial: true,
                    }),
                ),
                {
                    preventExtraKeys: true,
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
                recordShape({
                    keys: uuidShape(),
                    values: defineShape({
                        roomName: '',
                        roomId: uuidShape(),
                        clientCount: -1,
                    }),
                    partial: true,
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
                moreStuff: recordShape({
                    keys: exactShape('hi'),
                    values: 0,
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
                moreStuff: recordShape({
                    keys: enumShape(SharedEnum),
                    values: 0,
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
                moreStuff: recordShape({
                    keys: unionShape(exactShape('hi'), exactShape('bye')),
                    values: 0,
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
            {
                allowExtraKeys: true,
            },
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
                moreStuff: recordShape({
                    keys: '',
                    values: 0,
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
                    moreStuff: recordShape({
                        keys: exactShape('hi'),
                        values: 0,
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
                    moreStuff: recordShape({
                        keys: enumShape(SharedEnum),
                        values: 0,
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
                    moreStuff: recordShape({
                        keys: unionShape(exactShape('hi'), exactShape('bye')),
                        values: 0,
                    }),
                }),
            ),
        );
    });

    it('has proper types for a nested exact', () => {
        const myShape = defineShape({
            message: exactShape('hello'),
        });

        type MyType = typeof myShape.runtimeType;

        const instance = {} as any;

        const result: MyType | undefined = checkValidShape(instance, myShape)
            ? instance
            : undefined;
    });

    it('allows optional properties', () => {
        const myShape = defineShape(
            unionShape(
                {
                    prop1: '',
                    prop2: 2,
                },
                {
                    prop1: '',
                    prop2: 2,
                    prop3: unionShape(undefined, ''),
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

    it('works with complex union', () => {
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
            message: exactShape(EmailBatchVerificationStatusMessageEnum.InProgress),
        });

        const verificationResultCompletedShape = defineShape({
            message: exactShape(EmailBatchVerificationStatusMessageEnum.Completed),
            emails: [
                {
                    email: '',
                    state: enumShape(VerificationStateEnum),
                },
            ],
        });

        const VerificationResultShape = defineShape(
            unionShape(verificationResultInProgressShape, verificationResultCompletedShape),
        );

        assertValidShape(result, VerificationResultShape, {
            allowExtraKeys: true,
        });

        assert.deepEquals(
            VerificationResultShape.default,
            verificationResultInProgressShape.default,
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
                matchMessage: '/top/second/third/hi/1: Expected string',
            },
        );
    });

    it('works on example pull request vir config', () => {
        const reviewRuleWithoutOverridesShape = defineShape({
            autoAdd: optionalShape(true),
            users: optionalShape(['']),
            required: optionalShape(unionShape(exactShape('all'), 1)),
            codeOwns: optionalShape(
                unionShape(
                    {
                        paths: optionalShape([unionShape('', classShape(RegExp))]),
                        notPaths: optionalShape([unionShape('', classShape(RegExp))]),
                    },
                    undefined,
                ),
            ),
        });
        const reviewRuleShape = defineShape(
            intersectShape(reviewRuleWithoutOverridesShape, {
                userOverrides: optionalShape(
                    unionShape(
                        recordShape({
                            keys: '',
                            values: reviewRuleWithoutOverridesShape,
                        }),
                        undefined,
                    ),
                ),
            }),
        );
        const configShape = defineShape({
            assignToAuthor: optionalShape(true),
            waitForParentPullRequest: optionalShape(true),
            blockNoMerge: optionalShape(true),
            checkPrimaryReviewer: optionalShape(true),
            ignoreDraft: optionalShape(true),
            reviewRules: optionalShape([reviewRuleShape]),
            insertCodeOwners: optionalShape(true),
            scripts: optionalShape([
                () => {},
            ]),
        });

        const value: typeof configShape.runtimeType = {
            assignToAuthor: true,
            blockNoMerge: true,
            checkPrimaryReviewer: false,
            ignoreDraft: true,
            insertCodeOwners: true,
            waitForParentPullRequest: true,
            reviewRules: [
                // all devs
                {
                    autoAdd: true,
                    users: [
                        'electrovir',
                    ],
                    required: 1,
                    userOverrides: {
                        electrovir: {
                            required: 0,
                        },
                    },
                },
                {
                    autoAdd: false,
                    users: ['electrovir'],
                },
            ],
        };

        assertValidShape(value, configShape);
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
                matchMessage: '/top/2/nested: Expected required property',
            },
        );
    });

    itCases(assertValidShape, [
        {
            it: 'accepts extra keys in items',
            inputs: [
                [
                    'a',
                    'b',
                    {
                        a: 'hi',
                        b: 'bye',
                    },
                ],
                Type.Tuple([
                    Type.String(),
                    Type.String(),
                    Type.Object({
                        a: Type.String(),
                    }),
                ]),
                {
                    allowExtraKeys: true,
                },
            ],
            throws: undefined,
        },
        {
            it: 'blocks extra keys in items',
            inputs: [
                [
                    'a',
                    'b',
                    {
                        a: 'hi',
                        b: 'bye',
                    },
                ],
                Type.Tuple([
                    Type.String(),
                    Type.String(),
                    Type.Object({
                        a: Type.String(),
                    }),
                ]),
                {
                    preventExtraKeys: true,
                },
            ],
            throws: {
                matchMessage: '/2/b: Unexpected property',
            },
        },
        {
            it: 'allows extra keys',
            inputs: [
                {
                    a: '1',
                    b: '2',
                    c: '3',
                },
                defineShape({
                    a: '',
                }),
                {
                    allowExtraKeys: true,
                },
            ],
            throws: undefined,
        },
        {
            it: 'blocks extra keys in items schema',
            inputs: [
                [
                    {
                        a: 'hi',
                        b: 'bye',
                    },
                ],
                Type.Array(
                    Type.Object({
                        a: Type.String(),
                    }),
                ),
                {
                    preventExtraKeys: true,
                },
            ],
            throws: {
                matchMessage: '/0/b: Unexpected property',
            },
        },
        {
            it: 'accepts extra keys in intersections',
            inputs: [
                {
                    a: 'hi',
                    b: 'bye',
                    c: 'see',
                },
                Type.Intersect([
                    Type.Object({
                        a: Type.String(),
                    }),
                    Type.Object({
                        b: Type.String(),
                    }),
                ]),
                {
                    allowExtraKeys: true,
                },
            ],
            throws: undefined,
        },
        {
            it: 'blocks extra keys in intersections',
            inputs: [
                {
                    a: 'hi',
                    b: 'bye',
                    c: 'see',
                },
                Type.Intersect([
                    Type.Object({
                        a: Type.String(),
                    }),
                    Type.Object({
                        b: Type.String(),
                    }),
                ]),
                {
                    preventExtraKeys: true,
                },
            ],
            throws: {
                matchMessage: '/b: Unexpected property',
            },
        },
        {
            it: 'blocks extra keys by schema',
            inputs: [
                {
                    a: '',
                    b: '',
                },
                recordShape({
                    keys: exactShape('a'),
                    values: '',
                }),
                {
                    preventExtraKeys: true,
                },
            ],
            throws: {
                matchMessage: 'Failure at keys: b',
            },
        },
        {
            it: 'force blocks extra keys',
            inputs: [
                {
                    a: '',
                    b: '',
                },
                defineShape({
                    a: '',
                }),
                {
                    preventExtraKeys: true,
                },
            ],
            throws: {
                matchMessage: '/b: Unexpected property',
            },
        },
        {
            it: 'force allows extra keys',
            inputs: [
                {
                    a: '',
                    b: '',
                },
                recordShape({
                    keys: 'a',
                    values: '',
                }),
                {
                    allowExtraKeys: true,
                },
            ],
            throws: undefined,
        },
        {
            it: 'accepts bigints',
            inputs: [
                123n,
                defineShape(1n),
            ],
            throws: undefined,
        },
        {
            it: 'accepts strings',
            inputs: [
                'hi',
                defineShape(''),
            ],
            throws: undefined,
        },
        {
            it: 'accepts numbers',
            inputs: [
                42,
                defineShape(-1),
            ],
            throws: undefined,
        },
        {
            it: 'accepts objects',
            inputs: [
                {
                    a: 'hi',
                    b: 'bye',
                },
                defineShape({
                    a: '',
                    b: '',
                }),
            ],
            throws: undefined,
        },
        {
            it: 'allows an object to have extra keys',
            inputs: [
                {
                    a: 'hi',
                    b: 'bye',
                    c: 'ya',
                },
                defineShape({
                    a: '',
                    b: '',
                }),
                {
                    allowExtraKeys: true,
                },
            ],
            throws: undefined,
        },
        {
            it: 'allows non-exact symbols',
            inputs: [
                {
                    a: Symbol('new'),
                    b: mockSymbol,
                },
                defineShape({
                    a: mockSymbol,
                    b: exactShape(mockSymbol),
                }),
            ],
            throws: undefined,
        },
        {
            it: 'fails on exact symbols',
            inputs: [
                Symbol('new'),
                exactShape(mockSymbol),
            ],
            throws: {
                matchMessage: "Expected symbol 'mock symbol",
            },
        },
        {
            it: 'prevents extra keys',
            inputs: [
                {
                    a: 'hi',
                    b: 'bye',
                    c: 'ya',
                },
                defineShape({
                    a: '',
                    b: '',
                }),
                {
                    preventExtraKeys: true,
                },
            ],
            throws: {
                matchMessage: '/c: Unexpected property',
            },
        },
    ]);
});

describe(checkValidShape.name, () => {
    const testCasesForIsValidCheck: ReadonlyArray<FunctionTestCase<typeof checkValidShape>> =
        testCases.map((testCase: any): FunctionTestCase<typeof checkValidShape> => {
            const newTestCase = {
                ...testCase,
                expect: testCase.throws ? false : true,
            };
            delete newTestCase.throws;
            return newTestCase;
        });
    itCases(checkValidShape, testCasesForIsValidCheck);
});

describe(checkWrapValidShape.name, () => {
    const testCasesForCheckWrapValidShape: ReadonlyArray<
        FunctionTestCase<typeof checkWrapValidShape>
    > = testCases.map((testCase): FunctionTestCase<typeof checkWrapValidShape> => {
        const newTestCase = {
            ...omitObjectKeys(testCase, ['throws']),
            expect: testCase.throws ? undefined : testCase.inputs[0],
        };
        return newTestCase as FunctionTestCase<typeof checkWrapValidShape>;
    });
    itCases(checkWrapValidShape, testCasesForCheckWrapValidShape);

    itCases(checkWrapValidShape, [
        {
            it: 'passes',
            inputs: [
                {
                    a: 'hi',
                },
                defineShape({
                    a: '',
                }),
            ],
            expect: {
                a: 'hi',
            },
        },
        {
            it: 'rejects',
            inputs: [
                {
                    a: 3,
                },
                defineShape({
                    a: '',
                }),
            ],
            expect: undefined,
        },
    ]);
});

describe(assertWrapValidShape.name, () => {
    it('has proper types', () => {
        assert.tsType(assertWrapValidShape('', defineShape(''))).equals<string>();
    });

    const testCasesForAssertWrapValidShape: ReadonlyArray<
        FunctionTestCase<typeof assertWrapValidShape>
    > = testCases.map((testCase): FunctionTestCase<typeof assertWrapValidShape> => {
        const newTestCase = {
            ...omitObjectKeys(testCase, ['throws']),
            ...(testCase.throws
                ? {
                      throws: testCase.throws,
                  }
                : {
                      expect: testCase.inputs[0],
                  }),
        };
        return newTestCase as FunctionTestCase<typeof assertWrapValidShape>;
    });
    itCases(assertWrapValidShape, testCasesForAssertWrapValidShape);

    itCases(assertWrapValidShape, [
        {
            it: 'passes',
            inputs: [
                {
                    a: 'hi',
                },
                defineShape({
                    a: '',
                }),
            ],
            expect: {
                a: 'hi',
            },
        },
        {
            it: 'rejects',
            inputs: [
                {
                    a: 3,
                },
                defineShape({
                    a: '',
                }),
            ],
            throws: {
                matchConstructor: ShapeMismatchError,
            },
        },
    ]);
});

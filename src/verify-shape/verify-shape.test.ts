import {FunctionTestCase, assertTypeOf, itCases} from '@augment-vir/browser-testing';
import {ArrayElement} from '@augment-vir/common';
import {defineShape} from '../define-shape/define-shape';
import {and, enumShape, exact, or, unknownShape} from '../define-shape/shape-specifiers';
import {ShapeMismatchError} from '../errors/shape-mismatch.error';
import {assertValidShape, isValidShape} from './verify-shape';

const sharedRegExp = /shared/;

enum sharedEnum {
    First = 'first',
    Second = 'second',
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
        throws: ShapeMismatchError,
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
                c: new RegExp(''),
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
        throws: ShapeMismatchError,
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
        throws: ShapeMismatchError,
    },
    {
        it: 'works with enum shapes',
        inputs: [
            {
                a: 'big key',
                b: 42,
                c: sharedEnum.First,
            },
            defineShape({
                a: '',
                b: 0,
                c: enumShape(sharedEnum),
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
                c: sharedEnum.First,
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
        throws: ShapeMismatchError,
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
        throws: ShapeMismatchError,
    },
    {
        it: 'accepts anything for unknownShape at the top level',
        inputs: [
            {
                a: 'big key',
                b: 42,
                c: sharedEnum.First,
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
                c: enumShape(sharedEnum),
            }),
        ],
        throws: ShapeMismatchError,
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
        throws: ShapeMismatchError,
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
        throws: ShapeMismatchError,
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
        throws: ShapeMismatchError,
    },
    {
        it: 'passes a default value from an and',
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
        throws: ShapeMismatchError,
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

        assertTypeOf<(typeof shapeWithNested)['runTimeType']>().toEqualTypeOf<{
            stringProp: string;
            andProp: {hi: string; bye: string};
            nestedShape: (typeof lowerLevelShape)['runTimeType'];
            exactProp: 'derp';
        }>();

        const exampleInstance: (typeof shapeWithNested)['runTimeType'] = {
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

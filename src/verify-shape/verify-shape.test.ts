import {FunctionTestCase, itCases} from '@augment-vir/browser-testing';
import {defineShape} from '../define-shape/define-shape';
import {and, exact, or} from '../define-shape/shape-specifiers';
import {ShapeMismatchError} from '../errors/shape-mismatch.error';
import {assertValidShape, isValidShape} from './verify-shape';

const sharedRegExp = /shared/;

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
        it: 'fails if an object getter throws an error',
        inputs: [
            {
                a: 'what',
                get b(): string {
                    throw new Error('failed to get b');
                },
                c: {a: 0, c: ''},
            },
            defineShape({
                a: 'what',
                b: and('', {
                    get b(): string {
                        throw new Error('failed to get b');
                    },
                }),
                c: and({a: 0}, {b: ''}),
            }),
        ],
        throws: Error,
    },
];

describe(assertValidShape.name, () => {
    itCases(assertValidShape, testCases);
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

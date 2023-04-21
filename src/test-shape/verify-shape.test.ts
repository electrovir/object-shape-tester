import {itCases} from '@augment-vir/browser-testing';
import {defineShape} from '../define-shape/define-shape';
import {and, exact, or} from '../define-shape/shape-specifiers';
import {ShapeMismatchError} from '../errors/shape-mismatch.error';
import {assertValidShape} from './verify-shape';

describe(assertValidShape.name, () => {
    const sharedRegExp = /shared/;

    itCases(assertValidShape, [
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
    ]);
});

import {describe, itCases} from '@augment-vir/test';
import {ShapeMismatchError} from '../errors/shape-mismatch.error.js';
import {defineShape} from '../shape/shape.js';
import {parseJsonWithShape} from './parse-json-with-shape.js';

describe(parseJsonWithShape.name, () => {
    itCases(parseJsonWithShape, [
        {
            it: 'parses json',
            inputs: [
                JSON.stringify({a: 'hi', b: 3}),
                defineShape({
                    a: '',
                    b: 1,
                }),
            ],
            expect: {a: 'hi', b: 3},
        },
        {
            it: 'rejects invalid shape',
            inputs: [
                JSON.stringify({a: 'hi', b: 3}),
                defineShape({
                    a: 1,
                    b: 1,
                }),
            ],
            throws: {
                matchConstructor: ShapeMismatchError,
            },
        },
        {
            it: 'allows extra keys',
            inputs: [
                JSON.stringify({a: 'hi', b: 3}),
                defineShape({
                    a: '',
                }),
            ],
            expect: {a: 'hi', b: 3},
        },
    ]);
});

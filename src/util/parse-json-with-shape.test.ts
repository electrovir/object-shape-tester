import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {nullableShape} from '../custom-shapes/nullable.shape.js';
import {ShapeMismatchError} from '../errors/shape-mismatch.error.js';
import {defineShape} from '../shape/shape.js';
import {parseJsonWithShape} from './parse-json-with-shape.js';

describe(parseJsonWithShape.name, () => {
    it('returns the proper type', () => {
        assert
            .tsType(
                parseJsonWithShape(
                    JSON.stringify({a: 'hi', b: 3}),
                    defineShape({
                        a: '',
                        b: 1,
                    }),
                ),
            )
            .equals<{
                a: string;
                b: number;
            }>();
    });

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
            it: 'handles empty string',
            inputs: [
                '',
                nullableShape(-1),
            ],
            expect: undefined,
        },
        {
            it: 'handles undefined string',
            inputs: [
                'undefined',
                nullableShape(-1),
            ],
            expect: undefined,
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
                {
                    allowExtraKeys: true,
                },
            ],
            expect: {a: 'hi', b: 3},
        },
    ]);
});

import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {Type} from '@sinclair/typebox';
import {checkValidShape} from '../check-shape.js';
import {defineShape} from '../shape.js';
import {optionalShape} from './optional.shape.js';

describe(optionalShape.name, () => {
    it('has proper types', () => {
        const shape = defineShape({
            a: '',
            b: optionalShape(-1),
        });

        assert.deepEquals(shape.default, {
            a: '',
            b: -1,
        });
        assert.tsType<typeof shape.runtimeType>().equals<{
            a: string;
            b?: number;
        }>();
    });
    it('works with schema optional', () => {
        const shape = defineShape({
            a: '',
            b: Type.Optional(Type.Number({default: -1})),
        });

        assert.deepEquals(shape.default, {
            a: '',
            b: -1,
        });
        assert.tsType<typeof shape.runtimeType>().equals<{
            a: string;
            b?: number;
        }>();
    });

    itCases(
        (input: unknown, shape: unknown) => checkValidShape(input, defineShape(shape)),
        [
            {
                it: 'accepts missing optional property',
                inputs: [
                    {
                        a: 'hi',
                    },
                    {
                        a: '',
                        b: optionalShape(-1),
                    },
                ],
                expect: true,
            },
            {
                it: 'accepts present optional property',
                inputs: [
                    {
                        a: 'hi',
                        b: 42,
                    },
                    {
                        a: '',
                        b: optionalShape(-1),
                    },
                ],
                expect: true,
            },
            {
                it: 'rejects invalid optional property',
                inputs: [
                    {
                        a: 'hi',
                        b: 'bye',
                    },
                    {
                        a: '',
                        b: optionalShape(-1),
                    },
                ],
                expect: false,
            },
        ],
    );
});

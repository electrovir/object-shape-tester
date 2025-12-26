import {assert, type Primitive} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {checkValidShape} from '../shape/check-shape.js';
import {primitiveShape} from './primitive.shape.js';

describe(primitiveShape.name, () => {
    it('type guards', () => {
        const value: unknown = 3;

        if (checkValidShape(value, primitiveShape())) {
            assert.tsType(value).equals<Primitive>();
        } else {
            assert.tsType(value).notEquals<Primitive>();
        }
    });

    it('applies a default value', () => {
        const primitiveShapeWithDefault = primitiveShape(5);

        const value: unknown = 3;

        if (checkValidShape(value, primitiveShapeWithDefault)) {
            assert.tsType(value).equals<Primitive>();
        } else {
            assert.tsType(value).notEquals<Primitive>();
        }
        assert.strictEquals(primitiveShapeWithDefault.default, 5);
    });

    itCases(
        (value: unknown) => checkValidShape(value, primitiveShape()),
        [
            {
                it: 'accepts a string',
                input: 'hi',
                expect: true,
            },
            {
                it: 'accepts a number',
                input: -1,
                expect: true,
            },
            {
                it: 'accepts a bigint',
                input: 3n,
                expect: true,
            },
            {
                it: 'accepts a boolean',
                input: false,
                expect: true,
            },
            {
                it: 'accepts a symbol',
                input: Symbol(),
                expect: true,
            },
            {
                it: 'accepts null',
                input: null,
                expect: true,
            },
            {
                it: 'accepts undefined',
                input: 'hi',
                expect: true,
            },
            {
                it: 'rejects an object',
                input: {},
                expect: false,
            },
        ],
    );
});

import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {partialShape} from './partial-shape.js';

describe(partialShape.name, () => {
    const myShape = partialShape({
        id: '',
        name: '',
        age: -1,
    });

    it('preserves the default', () => {
        assert.deepEquals(myShape.default, {
            id: '',
            name: '',
            age: -1,
        });
    });
    it('type guards', () => {
        const value = myShape.default;
        assert.tsType(value).equals<
            Readonly<
                Partial<{
                    id: string;
                    name: string;
                    age: number;
                }>
            >
        >();
        assert.tsType<typeof myShape.runtimeType>().equals<
            Partial<{
                id: string;
                name: string;
                age: number;
            }>
        >();
    });
    itCases(
        (input: unknown) => {
            return assertValidShape(input, myShape, {
                preventExtraKeys: true,
            });
        },
        [
            {
                it: 'accepts an empty object',
                input: {},
                throws: undefined,
            },
            {
                it: 'accepts a partial object',
                input: {
                    id: 'something',
                },
                throws: undefined,
            },
            {
                it: 'accepts full object',
                input: {
                    id: 'something',
                    name: 'else',
                    age: 100,
                },
                throws: undefined,
            },
            {
                it: 'rejects an invalid property',
                input: {
                    invalid: 'prop',
                },
                throws: {
                    matchMessage: 'Unexpected property',
                },
            },
        ],
    );
});

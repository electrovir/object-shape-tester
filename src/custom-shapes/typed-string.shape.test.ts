import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {typedStringShape} from './typed-string.shape.js';

type MyCustomString = `${string}-${string}`;

describe(typedStringShape.name, () => {
    it('preserves the default', () => {
        assert.strictEquals(typedStringShape<MyCustomString>().default, '' as MyCustomString);
        assert.strictEquals(
            typedStringShape<MyCustomString>('test-default').default,
            'test-default',
        );
    });
    it('type guards', () => {
        const value = typedStringShape<MyCustomString>().default;
        assert.tsType(value).notEquals<string>();
        assertValidShape(value, typedStringShape<MyCustomString>());
        assert.tsType(value).equals<MyCustomString>();
    });
    itCases(
        (input: unknown) => assertValidShape(input, typedStringShape<MyCustomString>()),
        [
            {
                it: 'accepts an empty string',
                input: '',
                throws: undefined,
            },
            {
                it: 'accepts a non-type matched string',
                input: '1',
                throws: undefined,
            },
            {
                it: 'accepts a type matched string',
                input: '1-1',
                throws: undefined,
            },
            {
                it: 'rejects a non-string',
                input: 1,
                throws: {
                    matchMessage: 'Expected string',
                },
            },
        ],
    );
});

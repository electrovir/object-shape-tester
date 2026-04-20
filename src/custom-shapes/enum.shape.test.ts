import {assert} from '@augment-vir/assert';
import {wrapInTry} from '@augment-vir/common';
import {describe, it, itCases} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {enumShape} from './enum.shape.js';

enum TestEnum {
    First = 'first',
    Second = 'second',
    Third = 'third',
}

describe(enumShape.name, () => {
    it('has proper types', () => {
        const myEnumShape = enumShape(TestEnum);

        assert.tsType<typeof myEnumShape.runtimeType>().equals<TestEnum>();
        assert.strictEquals(myEnumShape.default, TestEnum.First);
    });
    it('handles custom default', () => {
        const myEnumShape = enumShape(TestEnum, TestEnum.Third);

        assert.tsType<typeof myEnumShape.runtimeType>().equals<TestEnum>();
        assert.strictEquals(myEnumShape.default, TestEnum.Third);

        // @ts-expect-error: intentionally invalid default value
        assert.throws(() => enumShape(TestEnum, 'wrong'));
    });
    it('has informative error message', () => {
        const error = wrapInTry(() => assertValidShape('invalid', enumShape(TestEnum)));
        assert.isError(error);
        assert.strictEquals(
            error.message.trim(),
            `Shape mismatch:
    Expected union value:
        Expected 'first'
        Expected 'second'
        Expected 'third'`,
        );
    });
    it('only allows one input', () => {
        // @ts-expect-error: missing args
        assert.throws(() => enumShape());
        // @ts-expect-error: wrong input
        enumShape('input must be an object');
        enumShape(TestEnum);
        enumShape({
            objectIs: 'okay too',
        });
    });

    itCases(
        (input: unknown, enumOptions: [any, any?]) =>
            assertValidShape(input, enumShape(...enumOptions)),
        [
            {
                it: 'accepts an enum value',
                inputs: [
                    TestEnum.First,
                    [
                        TestEnum,
                    ],
                ],
                throws: undefined,
            },
            {
                it: 'accepts an enum value string',
                inputs: [
                    'first',
                    [
                        TestEnum,
                    ],
                ],
                throws: undefined,
            },
            {
                it: 'rejects an invalid value',
                inputs: [
                    'invalid',
                    [
                        TestEnum,
                    ],
                ],
                throws: {
                    matchMessage: "Expected 'first'",
                },
            },
        ],
    );
});

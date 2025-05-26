import {assert} from '@augment-vir/assert';
import {createUuidV4, type Uuid} from '@augment-vir/common';
import {describe, it, itCases} from '@augment-vir/test';
import {type ExtractCustomSpecifierType} from '../define-shape/custom-specifier.js';
import {defineShape} from '../define-shape/define-shape.js';
import {or} from '../define-shape/shape-specifiers.js';
import {assertValidShape, isValidShape} from '../verify-shape/verify-shape.js';
import {nonEmptyStringShape, uuidShape} from './custom-string-shapes.js';

describe(uuidShape.customName, () => {
    const uuidShapeWrapper = defineShape({value: uuidShape});

    it('uses a uuid type', () => {
        assert.tsType<(typeof uuidShapeWrapper.runtimeType)['value']>().equals<Uuid>();
        assert.tsType<ExtractCustomSpecifierType<typeof uuidShape>>().equals<Uuid>();
    });

    it('uses a default value', () => {
        assert.isUuid(uuidShapeWrapper.defaultValue.value);
        assert.strictEquals(uuidShapeWrapper.defaultValue.value, uuidShape.defaultValue);
        assert.strictEquals(
            uuidShapeWrapper.defaultValue.value,
            '00000000-0000-1000-0000-000000000000',
        );
    });

    itCases(assertValidShape, [
        {
            it: 'rejects the nil UUID',
            inputs: [
                '00000000-0000-0000-0000-000000000000',
                defineShape(uuidShape),
            ],
            throws: {matchMessage: 'does not match UUID shape.'},
        },
        {
            it: 'accepts a valid UUID',
            inputs: [
                '00000000-0000-1000-0000-000000000000',
                defineShape(uuidShape),
            ],
            throws: undefined,
        },
        {
            it: 'rejects an invalid UUID',
            inputs: [
                '00000000-0000-10000000-000000000000',
                defineShape(uuidShape),
            ],
            throws: {matchMessage: 'does not match UUID shape.'},
        },
        {
            it: 'accepts a nested UUID',
            inputs: [
                {value: '00000000-0000-1000-0000-000000000000'},
                defineShape({value: uuidShape}),
            ],
            throws: undefined,
        },
        {
            it: 'rejects an invalid nested UUID',
            inputs: [
                {value: '00000000-0000-10000000-000000000000'},
                defineShape({value: uuidShape}),
            ],
            throws: {matchMessage: 'does not match UUID shape.'},
        },
        {
            it: 'rejects an nil nested UUID',
            inputs: [
                {value: '00000000-0000-0000-0000-000000000000'},
                defineShape({value: uuidShape}),
            ],
            throws: {matchMessage: 'does not match UUID shape.'},
        },
    ]);
});

describe(nonEmptyStringShape.customName, () => {
    const nonEmptyStringShapeWrapper = defineShape({value: nonEmptyStringShape});

    it('uses a string', () => {
        assert.tsType<(typeof nonEmptyStringShapeWrapper.runtimeType)['value']>().equals<string>();
        assert.tsType<ExtractCustomSpecifierType<typeof nonEmptyStringShape>>().equals<string>();
    });

    it('uses a default value', () => {
        assert.strictEquals(
            nonEmptyStringShapeWrapper.defaultValue.value,
            nonEmptyStringShape.defaultValue,
        );
        assert.strictEquals(nonEmptyStringShapeWrapper.defaultValue.value, ' ');
    });

    it('accepts a nested value', () => {
        assert.isTrue(
            isValidShape(
                {
                    id: createUuidV4(),
                },
                defineShape({
                    id: defineShape(uuidShape),
                }),
            ),
        );
    });
    it('accepts an or nested value', () => {
        assert.isTrue(
            isValidShape(
                {
                    id: createUuidV4(),
                },
                defineShape({
                    id: or(undefined, null, defineShape(uuidShape)),
                }),
            ),
        );
    });

    itCases(assertValidShape, [
        {
            it: 'accepts a string',
            inputs: [
                '0',
                defineShape(nonEmptyStringShape),
            ],
            throws: undefined,
        },
        {
            it: 'rejects an empty string',
            inputs: [
                '',
                defineShape(nonEmptyStringShape),
            ],
            throws: {matchMessage: 'does not match Non-empty String shape.'},
        },
        {
            it: 'accepts a nested string',
            inputs: [
                {value: '0'},
                defineShape({value: nonEmptyStringShape}),
            ],
            throws: undefined,
        },
        {
            it: 'rejects an empty nested string',
            inputs: [
                {value: ''},
                defineShape({value: nonEmptyStringShape}),
            ],
            throws: {matchMessage: 'does not match Non-empty String shape.'},
        },
    ]);
});

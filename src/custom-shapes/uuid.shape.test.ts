import {assert} from '@augment-vir/assert';
import {createUuidV4} from '@augment-vir/common';
import {describe, it, itCases} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {defineShape} from '../shape/shape.js';
import {unionShape} from './union.shape.js';
import {uuidShape, type Uuid} from './uuid.shape.js';

describe(uuidShape.name, () => {
    it('preserves the default', () => {
        assert.strictEquals(
            uuidShape('ee08a573-2855-4e99-b921-3e1c0de8c42a').default,
            'ee08a573-2855-4e99-b921-3e1c0de8c42a',
        );
        assert.isUuid('ee08a573-2855-4e99-b921-3e1c0de8c42a');
        assert.strictEquals(uuidShape().default, '00000000-0000-1000-0000-000000000000');
        assert.strictEquals(
            defineShape(uuidShape()).default,
            '00000000-0000-1000-0000-000000000000',
        );
        assert.isUuid('00000000-0000-1000-0000-000000000000');
    });
    it('type guards', () => {
        const value = uuidShape().default as string;
        assert.tsType(value).notEquals<Uuid>();
        assertValidShape(value, uuidShape());
        assert.tsType(value).equals<Uuid>();
    });
    itCases(
        (input: unknown, shape = uuidShape()) => assertValidShape(input, shape),
        [
            {
                it: 'rejects empty string',
                inputs: [''],
                throws: {
                    matchMessage: "Expected string to match 'uuid' format",
                },
            },
            {
                it: 'accepts the default uuid',
                inputs: [uuidShape().default],
                throws: undefined,
            },
            {
                it: 'accepts a nested UUID',
                inputs: [
                    {value: '00000000-0000-1000-0000-000000000000'},
                    defineShape({value: uuidShape()}),
                ],
                throws: undefined,
            },
            {
                it: 'accepts an or nested value',
                inputs: [
                    {
                        id: createUuidV4(),
                    },
                    defineShape({
                        id: unionShape(undefined, null, defineShape(uuidShape())),
                    }),
                ],
                throws: undefined,
            },
            {
                it: 'rejects an invalid nested UUID',
                inputs: [
                    {value: '00000000-0000-10000000-000000000000'},
                    defineShape({value: uuidShape()}),
                ],
                throws: {
                    matchMessage: "Expected string to match 'uuid' format",
                },
            },
            {
                it: 'rejects an nil nested UUID',
                inputs: [
                    {value: '00000000-0000-0000-0000-000000000000'},
                    defineShape({value: uuidShape()}),
                ],
                throws: {
                    matchMessage: "Expected string to match 'uuid' format",
                },
            },
            {
                it: 'rejects invalid UUID',
                inputs: ['00000000-0000-10000000-000000000000'],
                throws: {
                    matchMessage: "Expected string to match 'uuid' format",
                },
            },
            {
                it: 'rejects null UUID',
                inputs: ['00000000-0000-0000-0000-000000000000'],
                throws: {
                    matchMessage: "Expected string to match 'uuid' format",
                },
            },
            {
                it: 'rejects max UUID',
                inputs: ['FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'],
                throws: {
                    matchMessage: "Expected string to match 'uuid' format",
                },
            },
            {
                it: 'rejects non-UUID',
                inputs: ['not-a-uuid'],
                throws: {
                    matchMessage: "Expected string to match 'uuid' format",
                },
            },
            {
                it: 'accepts UUID',
                inputs: ['23f3eef2-682d-4a78-afda-129006318cdf'],
                throws: undefined,
            },
            {
                it: 'accepts random UUID',
                inputs: [createUuidV4()],
                throws: undefined,
            },
        ],
    );
});

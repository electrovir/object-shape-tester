import {assert} from '@augment-vir/assert';
import {createUuidV4} from '@augment-vir/common';
import {describe, it, itCases} from '@augment-vir/test';
import {checkValidShape} from '../check-shape.js';
import {defineShape} from '../shape.js';
import {uuidShape} from './uuid.shape.js';

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
    it('type guards', () => {});
    itCases(
        (input: unknown) => checkValidShape(input, uuidShape()),
        [
            {
                it: 'rejects empty string',
                input: '',
                expect: false,
            },
            {
                it: 'rejects null UUID',
                input: '00000000-0000-0000-0000-000000000000',
                expect: false,
            },
            {
                it: 'rejects max UUID',
                input: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
                expect: false,
            },
            {
                it: 'rejects non-UUID',
                input: 'not-a-uuid',
                expect: false,
            },
            {
                it: 'accepts UUID',
                input: '23f3eef2-682d-4a78-afda-129006318cdf',
                expect: true,
            },
            {
                it: 'accepts random UUID',
                input: createUuidV4(),
                expect: true,
            },
        ],
    );
});

import {assert} from '@augment-vir/assert';
import type {Uuid} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {uuidShape} from '../literal-specifiers/uuid.js';
import {defineShape} from './define-shape.js';
import type {ExtractLiteralSpecifierType} from './literal-specifier.js';

describe('uuidShape', () => {
    const uuidShapeWrapper = defineShape({
        value: uuidShape,
    });

    it('uses a uuid type', () => {
        assert.tsType<(typeof uuidShapeWrapper.runtimeType)['value']>().equals<Uuid>();
        assert.tsType<ExtractLiteralSpecifierType<typeof uuidShape>>().equals<Uuid>();
    });

    it('uses a default value', () => {
        assert.strictEquals(uuidShapeWrapper.defaultValue.value, uuidShape.defaultValue);
    });
});

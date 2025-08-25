import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {assertValidShape} from '../check-shape.js';
import {classShape} from './class.shape.js';

describe(classShape.name, () => {
    it('has proper types', () => {
        const value1 = new RegExp('something') as unknown;
        assert.tsType(value1).equals<unknown>();
        assertValidShape(value1, classShape(RegExp));
        assert.tsType(value1).equals<RegExp>();
    });
});

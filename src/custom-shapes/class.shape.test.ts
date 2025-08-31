import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {classShape} from './class.shape.js';

describe(classShape.name, () => {
    it('has proper types', () => {
        const value1 = new RegExp('something') as unknown;
        assert.tsType(value1).equals<unknown>();
        assertValidShape(value1, classShape(RegExp));
        assert.tsType(value1).equals<RegExp>();
    });

    it('creates class default values', () => {
        const myShape = classShape(Error);
        assert.instanceOf(myShape.default, Error);

        const defaultValue = {} as any;
        assert.strictEquals(classShape(Error, defaultValue).default, defaultValue);
    });

    it('requires a constructor input', () => {
        // @ts-expect-error: a string instance is not a constructor
        classShape('hi');
        // @ts-expect-error an object is not a constructor
        classShape({});
        // @ts-expect-error a function is not a constructor
        classShape(() => {});

        classShape(Error);
        classShape(HTMLElement);
    });
});

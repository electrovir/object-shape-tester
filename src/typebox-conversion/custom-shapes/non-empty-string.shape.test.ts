import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {assertValidShape} from '../check-shape.js';
import {defineShape} from '../shape.js';
import {nonEmptyShape} from './non-empty-string.shape.js';

describe(nonEmptyShape.name, () => {
    it('has proper types', () => {
        const myShape = defineShape(nonEmptyShape('hello'));

        assert.tsType<typeof myShape.runtimeType>().equals<string>();
        assert.strictEquals(myShape.default, 'hello');
    });
    it('has useful errors', () => {
        assert.throws(() => assertValidShape('', nonEmptyShape()), {
            matchMessage: 'farts',
        });
    });
});

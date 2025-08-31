import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {defineShape} from '../shape/shape.js';
import {nonEmptyStringShape} from './non-empty-string.shape.js';

describe(nonEmptyStringShape.name, () => {
    it('has proper types', () => {
        const myShape = defineShape(nonEmptyStringShape('hello'));

        assert.tsType<typeof myShape.runtimeType>().equals<string>();
        assert.strictEquals(myShape.default, 'hello');
    });
    it('has useful errors', () => {
        assert.throws(() => assertValidShape('', nonEmptyStringShape()), {
            matchMessage: "Expected string to match 'non-empty' format",
        });
    });

    it('accepts a nested value', () => {
        const shape = defineShape({
            value: nonEmptyStringShape(' '),
        });

        assertValidShape(
            {
                value: 'x',
            },
            shape,
        );
    });
});

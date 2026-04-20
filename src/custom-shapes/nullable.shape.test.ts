import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {defineShape} from '../shape/shape.js';
import {nullableShape} from './nullable.shape.js';

describe(nullableShape.name, () => {
    it('infers correct type', () => {
        const shape = nullableShape('hello');
        assert.tsType(shape.default).equals<string | null | undefined>();
        assert.strictEquals(shape.default, undefined);
        assert.tsType<typeof shape.runtimeType>().equals<string | null | undefined>();
        assertValidShape('hi', shape);
        assertValidShape(undefined, shape);
        assertValidShape(null, shape);

        const nestedShape = defineShape({
            a: shape,
        });
        assert.tsType(nestedShape.default).equals<Readonly<{a?: string | null | undefined}>>();
        assert.deepEquals(nestedShape.default, {
            a: undefined,
        });
        assert.tsType<typeof nestedShape.runtimeType>().equals<{a?: string | null | undefined}>();
        assertValidShape({}, nestedShape);
        assertValidShape(
            {
                a: 'hi',
            },
            nestedShape,
        );
        assertValidShape(
            {
                a: undefined,
            },
            nestedShape,
        );
        assertValidShape(
            {
                a: null,
            },
            nestedShape,
        );
    });
});

import {type ArrayElement, type AtLeastTuple} from '@augment-vir/common';
import {Type} from '@sinclair/typebox';
import {defineShape, type ShapeInitSchema} from '../shape/shape.js';

/**
 * Creates a shape that requires an of the given possible values.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {unionShape, checkValidShape} from 'object-shape-tester';
 *
 * const myShape = unionShape('', -1);
 *
 * checkValidShape('a', myShape); // `true`
 * checkValidShape(10, myShape); // `true`
 * checkValidShape({}, myShape); // `false`
 * ```
 */
export function unionShape<T extends Readonly<AtLeastTuple<any, 1>>>(...inits: T) {
    let defaultValue: undefined;
    const schemas = inits.map((init, index) => {
        const shape = defineShape(init);
        if (!index) {
            defaultValue = shape.default;
        }

        return shape.$_schema;
    });

    return defineShape(
        Type.Union<ShapeInitSchema<ArrayElement<T>>[]>(schemas, {
            default: defaultValue,
        }),
    );
}

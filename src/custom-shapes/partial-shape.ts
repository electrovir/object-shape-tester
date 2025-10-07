import {Type} from '@sinclair/typebox';
import {defineShape, type ShapeInitSchema} from '../shape/shape.js';

/**
 * Converts an object shape to a partial shape.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {partialShape, checkValidShape} from 'object-shape-tester';
 *
 * const myShape = partialShape({
 *     id: '',
 *     name: '',
 *     age: -1,
 * });
 *
 * checkValidShape({}, myShape); // `true`
 * checkValidShape(
 *     {
 *         id: '123',
 *         name: 'hello',
 *     },
 *     myShape,
 * ); // `true`
 * checkValidShape(
 *     {
 *         invalid: 'prop',
 *     },
 *     myShape,
 * ); // `false`
 * ```
 */
export function partialShape<T>(init: T) {
    const shape = defineShape(init);

    return defineShape(
        Type.Partial<ShapeInitSchema<T>>(shape.$_schema, {
            default: shape.default,
        }),
    );
}

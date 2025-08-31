import {type PartialWithUndefined} from '@augment-vir/common';
import {Type} from '@sinclair/typebox';
import {defineShape} from '../shape/shape.js';

/**
 * Creates a shape that allows an object property to be missing.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {optionalShape, checkValidShape, defineShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: '',
 *     b: optionalShape(-1),
 * });
 *
 * checkValidShape({a: 'hi', b: 0}, myShape); // `true`
 * checkValidShape({a: 'hi'}, myShape); // `true`
 * checkValidShape({b: 0}, myShape); // `false`
 * ```
 */
export function optionalShape<T>(
    shape: T,
    options: PartialWithUndefined<{
        alsoUndefined: boolean;
    }> = {},
) {
    const rawInnerSchema = defineShape(shape).$_schema;

    const innerSchema = options.alsoUndefined
        ? Type.Union([
              Type.Undefined(),
              rawInnerSchema,
          ])
        : rawInnerSchema;

    return defineShape(Type.Optional(innerSchema));
}

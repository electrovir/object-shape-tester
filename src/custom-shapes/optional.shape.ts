import {type PartialWithUndefined} from '@augment-vir/common';
import {
    type TOptionalWithFlag,
    type TSchema,
    type TUndefined,
    type TUnion,
    Type,
} from '@sinclair/typebox';
import {TypeSystemPolicy} from '@sinclair/typebox/system';
import {defineShape, type Shape, type ShapeInitSchema} from '../shape/shape.js';

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
export function optionalShape<T, const AlsoUndefined extends boolean = false>(
    shape: T,
    options: PartialWithUndefined<{
        /**
         * - `true`: Allow the optional property to be present and possibly `undefined`.
         * - `false`: If the property is present, it cannot be `undefined`.
         *
         * @default `false`
         */
        alsoUndefined: AlsoUndefined;
    }> = {},
): Shape<
    TOptionalWithFlag<
        AlsoUndefined extends true ? TUnion<[TUndefined, ShapeInitSchema<T>]> : ShapeInitSchema<T>,
        true
    >
> {
    TypeSystemPolicy.ExactOptionalPropertyTypes = true;

    const shapeSchema = defineShape(shape).$_schema;

    const schema: TSchema = options.alsoUndefined
        ? Type.Union([
              Type.Undefined(),
              shapeSchema,
          ])
        : shapeSchema;

    return defineShape(Type.Optional(schema)) as Shape<
        TOptionalWithFlag<
            AlsoUndefined extends true
                ? TUnion<[TUndefined, ShapeInitSchema<T>]>
                : ShapeInitSchema<T>,
            true
        >
    >;
}

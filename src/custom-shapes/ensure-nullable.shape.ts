import {mapObjectValues} from '@augment-vir/common';
import {
    Type,
    type OptionalKind,
    type TNull,
    type TSchema,
    type TUndefined,
    type TUnsafe,
} from '@sinclair/typebox';
import {type IsAny, type OptionalKeysOf, type RequiredKeysOf, type Simplify} from 'type-fest';
import {defineShape, type Shape, type ShapeInitType} from '../shape/shape.js';
import {
    canSchemaBeNullable,
    insertUnion,
    isObjectSchema,
    isUndefinedSchema,
    matchesSchemaGuard,
    operateOnExtraction,
} from '../util/typebox-util.js';

/**
 * Checks if a type is possibly `undefined` or `null`. `any` is included.
 *
 * @category Internal
 */
export type IsNullable<T> =
    IsAny<T> extends true
        ? true
        : null extends Extract<T, null>
          ? true
          : undefined extends Extract<T, undefined>
            ? true
            : false;

/**
 * Checks if a schema is possibly `undefined`, `null`, or optional. `any` is included.
 *
 * @category Internal
 */
export type IsNullableSchema<T extends TSchema> =
    IsNullable<ShapeInitType<T>> extends true
        ? true
        : T extends TNull
          ? true
          : T extends TUndefined
            ? true
            : T[typeof OptionalKind] extends 'Optional'
              ? true
              : false;

/**
 * Ensures that any property that is optional, potentially `null` or `undefined` is fully optional,
 * possibly `null` or `undefined`.
 *
 * @category Internal
 */
export type EnsureNullableType<Original> = Original extends object
    ? Simplify<
          {
              [Key in RequiredKeysOf<Original> as IsNullable<Original[Key]> extends true
                  ? never
                  : Key]: EnsureNullableType<Original[Key]>;
          } & {
              [Key in OptionalKeysOf<Original>]?:
                  | EnsureNullableType<Original[Key]>
                  | undefined
                  | null;
          } & {
              [Key in RequiredKeysOf<Original> as IsNullable<Original[Key]> extends true
                  ? Key
                  : never]?: EnsureNullableType<Original[Key]> | undefined | null;
          }
      >
    : Original;

/**
 * Creates a shape from an object shape where any property that can be any kind of nullable
 * (optional, `null`, or `undefined`) can now be _all_ kinds of nullable. That is, any property that
 * is optional or can be `null` or `undefined` becomes all three.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {
 *     nullToNullableShape,
 *     unionShape,
 *     assertValidShape,
 *     defineShape,
 * } from 'object-shape-tester';
 *
 * const myShape = nullToNullableShape({
 *     a: '',
 *     b: unionShape(null, -1),
 *     c: null,
 *     d: {
 *         e: unionShape(null, ''),
 *     },
 * });
 *
 * // passes
 * assertValidShape({a: 'hi', b: null, d: {}}, myShape);
 * assertValidShape({a: 'hi', b: undefined, d: {e: undefined}}, myShape);
 *
 * // fails
 * assertValidShape({b: null}, myShape);
 * assertValidShape({a: 'hi'}, myShape);
 * ```
 */
export function ensureNullableShape<Original>(
    originalShape: Original,
): Shape<TUnsafe<EnsureNullableType<ShapeInitType<Original>>>> {
    const shape = defineShape(originalShape);

    return defineShape(
        operateOnExtraction(shape.$_schema, isObjectSchema, (schema) => {
            const newProperties = mapObjectValues(schema.properties, (propKey, propSchema) => {
                const mappedPropSchema: TSchema = ensureNullableShape(propSchema).$_schema;

                if (!canSchemaBeNullable(mappedPropSchema)) {
                    return mappedPropSchema;
                }

                return Type.Optional(
                    matchesSchemaGuard(mappedPropSchema, isUndefinedSchema)
                        ? mappedPropSchema
                        : insertUnion({
                              originalSchema: mappedPropSchema,
                              insertion: Type.Undefined(),
                          }),
                );
            });

            return Type.Object(newProperties, {
                default: shape.default,
            });
        }),
    ) as Shape;
}

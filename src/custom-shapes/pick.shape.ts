import {
    filterMap,
    getObjectTypedEntries,
    type AnyObject,
    type ExtractKeysWithMatchingValues,
} from '@augment-vir/common';
import {Type, type TPick} from '@sinclair/typebox';
import {defineShape, type ShapeInitSchema, type ShapeInitType} from '../shape/shape.js';

/**
 * Type helper for {@link pickShape} to ensure that the selection parameter doesn't include extra
 * invalid keys.
 *
 * @category Internal
 */
export type EnforceSelectionKeys<
    OriginalKeys extends PropertyKey,
    Selection extends Readonly<AnyObject>,
> = Readonly<{
    [Key in keyof Selection]: Key extends OriginalKeys
        ? Selection[Key]
        : /** Invalid selection key. */
          never;
}>;

/**
 * Creates a shape by picking specific keys off of another object shape.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {pickShape, checkValidShape} from 'object-shape-tester';
 *
 * const myShape = pickShape(
 *     {
 *         hi: '',
 *         bye: -1,
 *     },
 *     {
 *         hi: true,
 *     },
 * );
 *
 * checkValidShape(
 *     {
 *         hi: 'some value',
 *     },
 *     myShape,
 * ); // `true`
 * checkValidShape(
 *     {
 *         hi: 'some value',
 *         bye: 100,
 *     },
 *     myShape,
 * ); // `false`
 * ```
 */
export function pickShape<
    const OriginalShape extends object,
    const Selection extends Readonly<Partial<Record<keyof ShapeInitType<OriginalShape>, boolean>>>,
>(
    originalShape: OriginalShape,
    selection: Selection &
        EnforceSelectionKeys<keyof NoInfer<ShapeInitType<OriginalShape>>, NoInfer<Selection>>,
) {
    const schema = defineShape(originalShape).$_schema;

    const pickKeys = filterMap(
        getObjectTypedEntries(selection),
        ([key]) => key,
        (
            key,
            [
                ,
                enabled,
            ],
        ) => !!enabled,
    ) as ExtractKeysWithMatchingValues<Selection, true>[];

    return defineShape(
        Type.Pick(schema, pickKeys) as AnyObject as TPick<
            ShapeInitSchema<OriginalShape>,
            ExtractKeysWithMatchingValues<Selection, true>[]
        >,
    );
}

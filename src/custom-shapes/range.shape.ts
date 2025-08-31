import {
    ensureErrorAndPrependMessage,
    ensureMinMax,
    wrapInTry,
    type MinMax,
    type PartialWithUndefined,
} from '@augment-vir/common';
import {Type, type TUnsafe} from '@sinclair/typebox';
import {assertValidShape} from '../shape/check-shape.js';
import {defineShape, type Shape} from '../shape/shape.js';

/**
 * Parameters for {@link rangeShape}.
 *
 * @category Internal
 */
export type RangeShapeParams = MinMax &
    PartialWithUndefined<{
        /**
         * If set to `true`, the `max` is exclusive (all values must be below the max).
         *
         * @default false
         */
        exclusiveMax: boolean;
        /**
         * If set to `true`, the `min` is exclusive (all values must be above the min).
         *
         * @default false
         */
        exclusiveMin: boolean;
        /** The shape's default value. If not provided, a value in between min and max is chosen. */
        default: number;
    }>;

/**
 * Creates a shape that requires a number within the given range. By default, the range is
 * inclusive. See {@link RangeShapeParams} for how to change that.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {rangeShape, checkValidShape} from 'object-shape-tester';
 *
 * const myShape = rangeShape({min: 1, max: 10});
 *
 * checkValidShape(1, myShape); // `true`
 * checkValidShape(0, myShape); // `false`
 * ```
 */
export function rangeShape<const T extends number = number>({
    exclusiveMax,
    exclusiveMin,
    ...params
}: Readonly<RangeShapeParams>): Shape<TUnsafe<T>> {
    const {min, max} = ensureMinMax(params);

    const defaultValue: number = params.default ?? (max - min) / 2 + min;

    const shape = defineShape(
        Type.Number({
            ...(exclusiveMin
                ? {
                      exclusiveMinimum: min,
                  }
                : {
                      minimum: min,
                  }),
            ...(exclusiveMax
                ? {
                      exclusiveMaximum: max,
                  }
                : {
                      maximum: max,
                  }),
            default: defaultValue,
        }),
    );

    const error = wrapInTry(() => assertValidShape(defaultValue, shape));
    if (error) {
        throw ensureErrorAndPrependMessage(error, 'Default range value is not within range.');
    }

    return shape as Shape as Shape<TUnsafe<T>>;
}

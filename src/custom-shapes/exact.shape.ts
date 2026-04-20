import {check} from '@augment-vir/assert';
import {wrapString} from '@augment-vir/common';
import {Kind, type SchemaOptions, type TUnsafe, Type, TypeRegistry} from '@sinclair/typebox';
import {registerErrorMessage} from '../errors/error-message.js';
import {defineShape, type Shape} from '../shape/shape.js';

/**
 * Creates a shape that requires matching the exact value give.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {exactShape, checkValidShape} from 'object-shape-tester';
 *
 * const myShape = exactShape('a');
 *
 * checkValidShape('a', myShape); // `true`
 * checkValidShape('c', myShape); // `false`
 *
 * // normally passing a string to a shape will simplify the shape.
 * checkValidShape('c', defineShape('a')); // `true`
 * ```
 */
export function exactShape<const T>(value: T): Shape<TUnsafe<T>> {
    if (check.isSymbol(value)) {
        return exactSymbolShape(value) as Shape<TUnsafe<T>>;
    }

    return defineShape(
        Type.Const<T>(value, {
            default: value,
        }),
    ) as Shape<TUnsafe<T>>;
}

/**
 * Kind for {@link exactShape}'s type registry entry when the value given to {@link exactShape} is a
 * symbol.
 *
 * @category Internal
 */
export const exactSymbolKind = 'ExactSymbol';

type ExactSymbolSchema = {
    [Kind]: typeof exactSymbolKind;
    symbol: symbol;
    default: symbol;
} & SchemaOptions;

function exactSymbolShape<const T extends symbol>(value: T): Shape<TUnsafe<T>> {
    if (!TypeRegistry.Has(exactSymbolKind)) {
        TypeRegistry.Set(exactSymbolKind, (schema: ExactSymbolSchema, value: unknown) => {
            return value === schema.symbol;
        });
    }
    registerErrorMessage(exactSymbolKind, ({schema}) => {
        const symbolDescription = schema.symbol?.description
            ? wrapString({
                  value: schema.symbol.description,
                  wrapper: "'",
              })
            : '<unnamed symbol>';
        return `Expected symbol ${symbolDescription}`;
    });

    return defineShape(
        Type.Unsafe<T>({
            [Kind]: exactSymbolKind,
            symbol: value,
            default: value,
        } satisfies ExactSymbolSchema),
    );
}

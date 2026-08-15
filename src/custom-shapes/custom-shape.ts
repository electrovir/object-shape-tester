import {Kind, Type, TypeRegistry} from '@sinclair/typebox';
import {defineShape} from '../shape/shape.js';

export {Kind} from '@sinclair/typebox';

/**
 * Easily create a custom shape.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {checkValidShape, createCustomShape} from 'object-shape-tester';
 * import {UtcIsoString, isValidIsoString} from 'date-vir';
 *
 * const utcIsoStringShape = createCustomShape({
 *     default: new Date().toISOString() as UtcIsoString,
 *     name: 'UtcIsoString',
 *     checkValue(value) {
 *         return isValidIsoString(value);
 *     },
 * });
 *
 * const myShape = utcIsoStringShape();
 *
 * checkValidShape(new Date().toISOString(), myShape); // `true`
 * checkValidShape('', myShape); // `false`
 * ```
 */
export function createCustomShape<T>({
    checkValue,
    default: outerDefaultValue,
    name,
}: {
    default: T;
    name: string;
    checkValue: (value: unknown) => value is T;
}) {
    if (!TypeRegistry.Has(name)) {
        TypeRegistry.Set(name, (schemaOptions, value) => checkValue(value));
    }

    return (defaultValue: T = outerDefaultValue) => {
        return defineShape(
            Type.Unsafe<T>({
                [Kind]: name,
                default: defaultValue,
            }),
        );
    };
}

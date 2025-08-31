import {getEnumValues, type Values} from '@augment-vir/common';
import {type TConst, Type} from '@sinclair/typebox';
import {defineShape, type ShapeInitSchema} from '../shape/shape.js';

/**
 * Creates a shape that requires matching a value within the given enum.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {enumShape, checkValidShape} from 'object-shape-tester';
 *
 * enum MyEnum {
 *     A = 'a',
 *     B = 'b',
 * }
 *
 * const myShape = enumShape(MyEnum);
 *
 * checkValidShape(MyEnum.A, myShape); // `true`
 * checkValidShape('a', myShape); // `true`
 * checkValidShape('c', myShape); // `false`
 * ```
 */
export function enumShape<const EnumObject extends Record<string, number | string>>(
    enumObject: EnumObject,
    /** If omitted or `undefined`, the first value in the enum object will be used as the default. */
    defaultValue?: Values<EnumObject> | undefined,
) {
    const enumValues = getEnumValues(enumObject);
    if (defaultValue != undefined && !enumValues.includes(defaultValue)) {
        throw new TypeError(`enumShape default must be a subset of the given enum.`);
    }

    return defineShape(
        Type.Union<ShapeInitSchema<TConst<Values<EnumObject>>>[]>(
            enumValues.map((value) => Type.Literal(value)) as any[],
            {
                default: defaultValue ?? enumValues[0],
            },
        ),
    );
}

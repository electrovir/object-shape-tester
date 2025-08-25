import {getEnumValues, type Values} from '@augment-vir/common';
import {Type} from '@sinclair/typebox';
import {defineShape, type ShapeInitSchema} from '../shape.js';

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
        Type.Union<ShapeInitSchema<Values<EnumObject>>[]>(
            enumValues.map((value) => Type.Literal(value)) as any[],
            {
                default: defaultValue ?? enumValues[0],
            },
        ),
    );
}

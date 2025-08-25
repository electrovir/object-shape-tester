import {type ArrayElement} from '@augment-vir/common';
import {Type} from '@sinclair/typebox';
import {defineShape, type ShapeInitSchema} from '../shape.js';

export function unionShape<T extends ReadonlyArray<any>>(...inits: T) {
    let defaultValue: undefined;
    const schemas = inits.map((init, index) => {
        const shape = defineShape(init);
        if (!index) {
            defaultValue = shape.default;
        }

        return shape.$_schema;
    });

    return defineShape(
        Type.Union<ShapeInitSchema<ArrayElement<T>>[]>(schemas, {
            default: defaultValue,
        }),
    );
}

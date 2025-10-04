import {type AnyObject} from '@augment-vir/common';
import {type TPick, Type} from '@sinclair/typebox';
import {defineShape, type ShapeInitSchema, type ShapeInitType} from '../shape/shape.js';

export function pickShape<const T extends object, const K extends (keyof ShapeInitType<T>)[]>(
    originalShape: T,
    pick: K,
) {
    const schema = defineShape(originalShape).$_schema;

    return defineShape(Type.Pick(schema, pick) as AnyObject as TPick<ShapeInitSchema<T>, K>);
}

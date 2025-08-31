import {type TSchema, Type} from '@sinclair/typebox';
import {defineShape, type ShapeInitSchema} from '../shape/shape.js';

/**
 * Creates a shape that requires a tuple.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {tupleShape, checkValidShape} from 'object-shape-tester';
 *
 * const myShape = tupleShape('', -1);
 *
 * checkValidShape(
 *     [
 *         'a',
 *         10,
 *     ],
 *     myShape,
 * ); // `true`
 * checkValidShape(
 *     [
 *         'a',
 *     ],
 *     myShape,
 * ); // `false`
 * ```
 */
export function tupleShape<T extends any[]>(...tupleParts: T) {
    const defaultValue: any[] = [];
    const schemas: TSchema[] = [];

    tupleParts.forEach((part) => {
        const shape = defineShape(part);
        defaultValue.push(shape.default);
        schemas.push(shape.$_schema);
    });

    return defineShape(
        Type.Tuple<{
            [Index in keyof T]: ShapeInitSchema<T[Index]>;
        }>(schemas as any, {
            default: defaultValue,
        }),
    );
}

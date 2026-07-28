import {type ArrayElement, type AtLeastTuple, type UnionToIntersection} from '@augment-vir/common';
import {type TUnsafe, Type} from '@sinclair/typebox';
import {defineShape, type ShapeInitType} from '../shape/shape.js';

/**
 * Creates a shape that merges multiple objects together. Note that intersecting fixed properties
 * with a `recordShape` (or other generic mapped object keys) is not supported and will break in
 * many ways.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {intersectShape, checkValidShape} from 'object-shape-tester';
 *
 * const myShape = intersectShape(
 *     {
 *         a: '',
 *     },
 *     {
 *         b: '',
 *     },
 * );
 *
 * checkValidShape({a: 'hi', b: 'bye'}, myShape); // `true`
 * checkValidShape({a: 'hi'}, myShape); // `false`
 * ```
 */
export function intersectShape<T extends AtLeastTuple<object, 1>>(...inits: T) {
    const combinedDefault = {};
    const schemas: any[] = inits.map((init) => {
        const shape = defineShape(init);
        Object.assign(combinedDefault, shape.default);
        return shape.$_schema;
    });

    return defineShape(
        Type.Composite(schemas, {
            default: combinedDefault,
        }) as any as TUnsafe<UnionToIntersection<ShapeInitType<ArrayElement<T>>>>,
    );
}

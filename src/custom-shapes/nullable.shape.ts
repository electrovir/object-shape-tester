import {optionalShape} from './optional.shape.js';
import {unionShape} from './union.shape.js';

/**
 * Creates a shape that is optional, possibly null, and possibly undefined.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {nullableShape, checkValidShape, defineShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: '',
 *     b: nullableShape(-1),
 * });
 *
 * checkValidShape({a: 'hi', b: 0}, myShape); // `true`
 * checkValidShape({a: 'hi', b: undefined}, myShape); // `true`
 * checkValidShape({a: 'hi', b: null}, myShape); // `true`
 * checkValidShape({a: 'hi'}, myShape); // `true`
 * checkValidShape({b: 0}, myShape); // `false`
 * ```
 */
export function nullableShape<T>(shape: T) {
    return optionalShape(unionShape(undefined, null, shape));
}

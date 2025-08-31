import {Type} from '@sinclair/typebox';
import {defineShape} from '../shape/shape.js';

/**
 * Creates a shape that allows any value. This should be used sparingly.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {unknownShape, checkValidShape} from 'object-shape-tester';
 *
 * const myShape = unknownShape();
 *
 * checkValidShape('a', myShape); // `true`
 * checkValidShape(10, myShape); // `true`
 * checkValidShape({}, myShape); // `true`
 * ```
 */
export function unknownShape(defaultValue?: unknown) {
    return defineShape(Type.Unknown({default: defaultValue}));
}

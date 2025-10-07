import {Type} from '@sinclair/typebox';
import {defineShape} from '../shape/shape.js';

/**
 * Creates a shape that requires a string and gives it a specific type. This does _not_ apply any
 * extra type safety beyond string checking.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {typedString, checkValidShape} from 'object-shape-tester';
 *
 * const myShape = typedString<`${string}-${string}`>();
 *
 * checkValidShape('1-2', myShape); // `true`
 * checkValidShape('1', myShape); // `true`
 * checkValidShape(1, myShape); // `false`
 * ```
 */
export function typedStringShape<const T extends string>(defaultValue: string = '') {
    return defineShape(Type.Unsafe<T>(Type.String({default: defaultValue})));
}

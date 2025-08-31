import {FormatRegistry, Type} from '@sinclair/typebox';
import {defineShape} from '../shape/shape.js';

/**
 * Creates a shape that requires a non-empty string.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {nonEmptyStringShape, checkValidShape} from 'object-shape-tester';
 *
 * const myShape = nonEmptyStringShape();
 *
 * checkValidShape(' ', myShape); // `true`
 * checkValidShape('', myShape); // `false`
 * ```
 */
export function nonEmptyStringShape(defaultValue: string = ' ') {
    if (!FormatRegistry.Has('non-empty')) {
        FormatRegistry.Set('non-empty', (value) => !!value);
    }

    return defineShape(
        Type.Unsafe<string>(Type.String({format: 'non-empty', default: defaultValue})),
    );
}

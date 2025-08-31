import {assertWrapValidShape, type CheckShapeOptions} from '../shape/check-shape.js';
import {type Shape} from '../shape/shape.js';

/**
 * Parse a JSON string and verify it against the given shape definition.
 *
 * @category Util
 * @example
 *
 * ```ts
 * import {parseJsonWithShape, defineShape} from 'object-shape-tester';
 *
 * const result = parseJsonWithShape('{"a": "hello"}', defineShape({a: ''}));
 * ```
 *
 * @throws If the parsed JSON does not match the shape definition or if the JSON parsing throws an
 *   error.
 */
export function parseJsonWithShape<const CurrentShape extends Shape>(
    json: string,
    shape: Readonly<CurrentShape>,
    options: CheckShapeOptions = {},
    failureMessage?: string | undefined,
): Shape['runtimeType'] {
    const parsed = JSON.parse(json);
    return assertWrapValidShape(parsed, shape, options, failureMessage);
}

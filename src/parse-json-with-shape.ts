import type {ShapeDefinition} from './define-shape/shape-specifiers.js';
import {assertValidShape} from './verify-shape/verify-shape.js';

/**
 * Parse a JSON string and verify it against the given shape definition.
 *
 * @category Main
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
export function parseJsonWithShape<const Shape extends ShapeDefinition<any, any>>(
    json: string,
    shape: Readonly<Shape>,
): Shape['runtimeType'] {
    const parsed = JSON.parse(json);
    assertValidShape(parsed, shape);

    return parsed;
}

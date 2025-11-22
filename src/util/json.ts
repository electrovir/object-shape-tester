import {assertWrapValidShape, type CheckShapeOptions} from '../shape/check-shape.js';
import {type Shape} from '../shape/shape.js';

/**
 * Parse a JSON string and verify it against the given shape definition. Also handles top level
 * empty strings and `'undefined'` (both are converted to `undefined`).
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
): CurrentShape['runtimeType'] {
    const parsed = json && json !== 'undefined' ? JSON.parse(json) : undefined;
    return assertWrapValidShape(parsed, shape, options, failureMessage);
}

/* node:coverage disable: this function only works in Node.js but this package runs tests in the web. */
/**
 * Read and parse a JSON file and verify its contents against the given shape definition. Also
 * handles top level empty strings and `'undefined'` (both are converted to `undefined`).
 *
 * This will only work when run in a server / Node.js environment.
 *
 * @category Util
 * @example
 *
 * ```ts
 * import {readJsonWithShape, defineShape} from 'object-shape-tester';
 *
 * const result = readJsonWithShape('./my-file.json', defineShape({a: ''}));
 * ```
 *
 * @throws If the parsed JSON does not match the shape definition or if the JSON parsing throws an
 *   error.
 */
export async function readJsonWithShape<const CurrentShape extends Shape>(
    filePath: string,
    shape: Readonly<CurrentShape>,
    options: CheckShapeOptions = {},
    failureMessage?: string | undefined,
) {
    const {readFile} = await import('node:fs/promises');
    const fileContents = await readFile(filePath, 'utf-8');
    return parseJsonWithShape(fileContents, shape, options, failureMessage);
}

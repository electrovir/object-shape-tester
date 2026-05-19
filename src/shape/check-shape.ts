import {type PartialWithUndefined} from '@augment-vir/common';
import {type TSchema} from '@sinclair/typebox';
import {ShapeMismatchError} from '../errors/shape-mismatch.error.js';
import {defineShape, type Shape} from '../shape/shape.js';

/**
 * Options for checking and asserting shapes.
 *
 * @category Internal
 */
export type CheckShapeOptions = PartialWithUndefined<{
    /**
     * Determines if extra keys are allowed, blocked, or not forced:
     *
     * - `true`: extra keys are forcibly allowed in all objects (`additionalProperties` is forced to
     *   `true` for all nested schemas).
     * - `false`: extra keys are forcibly blocked in all objects (`additionalProperties` is forced to
     *   `false` for all nested schemas).
     *
     * @deprecated Use `preventExtraKeys` instead.
     * @default true
     */
    allowExtraKeys: boolean;
    /**
     * Determines if extra keys are blocked:
     *
     * - `false`: extra keys are allowed in all objects (`additionalProperties` is forced to `true`
     *   for all nested schemas).
     * - `true`: extra keys are blocked in all objects (`additionalProperties` is forced to `false`
     *   for all nested schemas).
     *
     * @default false
     */
    preventExtraKeys: boolean;
}>;

/**
 * Checks if the given value matches the given shape and returns `true` or `false` as a type guard.
 *
 * @category Check
 * @returns `true` or `false`
 */
export function checkValidShape<SpecificShape extends Shape | TSchema>(
    this: void,
    value: unknown,
    shape: SpecificShape,
    options: CheckShapeOptions = {},
): value is RuntimeTypeOf<SpecificShape> {
    return getCompiledSchema(shape, options).Check(value);
}

/**
 * Checks if the given value matches the given shape. If it does, returns the value. If not, returns
 * `undefined`.
 *
 * @category Check
 * @returns The original `value` or `undefined.
 */
export function checkWrapValidShape<SpecificShape extends Shape | TSchema>(
    this: void,
    value: unknown,
    shape: SpecificShape,
    options: CheckShapeOptions = {},
): RuntimeTypeOf<SpecificShape> | undefined {
    if (checkValidShape(value, shape, options)) {
        return value;
    } else {
        return undefined;
    }
}

/**
 * Asserts that the given value matches the given shape.
 *
 * @category Check
 * @throws `ShapeMismatchError` if `value` does not match the shape.
 */
export function assertValidShape<SpecificShape extends Shape | TSchema>(
    this: void,
    value: unknown,
    shape: SpecificShape,
    options: CheckShapeOptions = {},
    failureMessage?: string | undefined,
): asserts value is RuntimeTypeOf<SpecificShape> {
    if (checkValidShape(value, shape, options)) {
        return;
    }

    const errors = Array.from(getCompiledSchema(shape, options).Errors(value));
    if (errors.length) {
        throw new ShapeMismatchError(errors, failureMessage);
    }
}

/**
 * Asserts that the given value matches the given shape and returns the original `value` if so.
 *
 * @category Check
 * @throws `ShapeMismatchError` if `value` does not match the shape.
 */
export function assertWrapValidShape<SpecificShape extends Shape | TSchema>(
    this: void,
    value: unknown,
    shape: SpecificShape,
    options: CheckShapeOptions = {},
    failureMessage?: string | undefined,
): RuntimeTypeOf<SpecificShape> {
    assertValidShape(value, shape, options, failureMessage);
    return value;
}

function getCompiledSchema(shape: Shape | TSchema, options: CheckShapeOptions) {
    shape = ensureShape(shape);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const preventExtraKeys = options.preventExtraKeys ?? options.allowExtraKeys === false;
    return preventExtraKeys ? shape.$_compiledSchemaNoExtraKeys : shape.$_compiledSchemaExtraKeys;
}

/**
 * Extracts the runtime type of the given Shape or Schema.
 *
 * @category Internal
 */
export type RuntimeTypeOf<SpecificShape extends Shape | TSchema> = (SpecificShape extends Shape
    ? SpecificShape
    : Shape<SpecificShape>)['runtimeType'];

/**
 * Ensures that the given shape or schema is a shape.
 *
 * @category Internal
 */
export function ensureShape<SpecificShape extends Shape | TSchema>(
    shape: SpecificShape,
): SpecificShape extends Shape ? SpecificShape : Shape<SpecificShape> {
    return defineShape(shape) as SpecificShape extends Shape ? SpecificShape : Shape<SpecificShape>;
}

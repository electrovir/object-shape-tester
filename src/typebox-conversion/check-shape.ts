import {type TSchema} from '@sinclair/typebox';
import {ShapeMismatchError} from '../errors/shape-mismatch.error.js';
import {defineShape, type Shape} from './shape.js';

export function checkValidShape<SpecificShape extends Shape | TSchema>(
    this: void,
    value: unknown,
    shape: SpecificShape,
): value is RuntimeTypeOf<SpecificShape> {
    return ensureShape(shape).$_compiledSchema.Check(value);
}

export function checkWrapValidShape<SpecificShape extends Shape | TSchema>(
    this: void,
    value: unknown,
    shape: SpecificShape,
): RuntimeTypeOf<SpecificShape> | undefined {
    if (checkValidShape(value, shape)) {
        return value;
    } else {
        return undefined;
    }
}

export function assertValidShape<SpecificShape extends Shape | TSchema>(
    this: void,
    value: unknown,
    shape: SpecificShape,
): asserts value is RuntimeTypeOf<SpecificShape> {
    const errors = Array.from(ensureShape(shape).$_compiledSchema.Errors(value));
    if (errors.length) {
        throw new ShapeMismatchError(value, errors);
    }
}

export function assertWrapValidShape<SpecificShape extends Shape | TSchema>(
    this: void,
    value: unknown,
    shape: SpecificShape,
): RuntimeTypeOf<SpecificShape> | undefined {
    assertValidShape(value, shape);
    return value;
}

export type RuntimeTypeOf<SpecificShape extends Shape | TSchema> = (SpecificShape extends Shape
    ? SpecificShape
    : Shape<SpecificShape>)['runtimeType'];

export function ensureShape<SpecificShape extends Shape | TSchema>(
    shape: SpecificShape,
): SpecificShape extends Shape ? SpecificShape : Shape<SpecificShape> {
    return defineShape(shape) as SpecificShape extends Shape ? SpecificShape : Shape<SpecificShape>;
}

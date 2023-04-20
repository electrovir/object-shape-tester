import {
    ArrayElement,
    isObject,
    isRuntimeTypeOf,
    typedArrayIncludes,
    typedHasProperty,
} from '@augment-vir/common';
import {LiteralToPrimitive, Primitive, Simplify, UnionToIntersection} from 'type-fest';

const andSymbol = Symbol('and');
const orSymbol = Symbol('or');
const exactSymbol = Symbol('exact');

const isShapeSpecifierSymbol = Symbol('is-shape-specifier');

const shapeSpecifiersTypes = [
    andSymbol,
    orSymbol,
    exactSymbol,
] as const;

type ShapeSpecifierType = ArrayElement<typeof shapeSpecifiersTypes>;

type ShapeSpecifier<Part, Type extends ShapeSpecifierType> = {
    [isShapeSpecifierSymbol]: true;
    parts: ReadonlyArray<Part>;
    specifierType: Type;
};

export type ShapeOr<Part> = ShapeSpecifier<Part, typeof orSymbol>;
export type ShapeAnd<Part> = ShapeSpecifier<Part, typeof andSymbol>;
export type ShapeExact<Part> = ShapeSpecifier<Part, typeof exactSymbol>;

export type SpecifierToRunTimeType<
    PossiblySpecifier,
    IsExact extends boolean = false,
> = PossiblySpecifier extends ShapeSpecifier<infer Part, infer Type>
    ? Type extends typeof andSymbol
        ? UnionToIntersection<Part>
        : Type extends typeof orSymbol
        ? Part
        : Type extends typeof exactSymbol
        ? Part
        : 'TypeError: found not match for shape specifier type.'
    : PossiblySpecifier extends Primitive
    ? IsExact extends true
        ? PossiblySpecifier
        : LiteralToPrimitive<PossiblySpecifier>
    : PossiblySpecifier;

export function or<Part>(...parts: ReadonlyArray<Part>): ShapeOr<Part> {
    return specifier(parts, orSymbol);
}

export function and<Part>(...parts: ReadonlyArray<Part>): ShapeAnd<Part> {
    return specifier(parts, andSymbol);
}

export function exact<Part>(...parts: ReadonlyArray<Part>): ShapeExact<Part> {
    return specifier(parts, exactSymbol);
}

function specifier<Part, Type extends ShapeSpecifierType>(
    parts: ReadonlyArray<Part>,
    specifierType: Type,
): ShapeSpecifier<Part, Type> {
    return {
        [isShapeSpecifierSymbol]: true,
        specifierType,
        parts,
    };
}

export type ShapeToRunTimeType<Shape, IsExact extends boolean = false> = Simplify<
    Shape extends object
        ? {
              [PropName in keyof Shape]: Shape[PropName] extends ShapeSpecifier<
                  any,
                  typeof exactSymbol
              >
                  ? ShapeToRunTimeType<SpecifierToRunTimeType<Shape[PropName], true>, true>
                  : ShapeToRunTimeType<SpecifierToRunTimeType<Shape[PropName], IsExact>, IsExact>;
          }
        : Shape
>;

export function getShapeSpecifier(
    input: unknown,
): ShapeSpecifier<unknown, ShapeSpecifierType> | undefined {
    if (!isObject(input)) {
        return undefined;
    }
    if (!typedHasProperty(input, isShapeSpecifierSymbol)) {
        return undefined;
    }

    if (
        !typedHasProperty(input, 'parts') ||
        !isRuntimeTypeOf(input.parts, 'array') ||
        !input.parts.length
    ) {
        throw new Error('Found a shape specifier but its parts are not valid.');
    }

    if (
        !typedHasProperty(input, 'specifierType') ||
        !typedArrayIncludes(shapeSpecifiersTypes, input.specifierType)
    ) {
        throw new Error('Found a shape specifier but its specifier type is not valid.');
    }

    return input as ShapeSpecifier<unknown, ShapeSpecifierType>;
}

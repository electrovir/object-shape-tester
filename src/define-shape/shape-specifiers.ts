import {
    ArrayElement,
    AtLeastTuple,
    isObject,
    isRuntimeTypeOf,
    typedArrayIncludes,
    typedHasProperty,
} from '@augment-vir/common';
import {LiteralToPrimitive, Primitive, Simplify, UnionToIntersection} from 'type-fest';
import {haveEqualTypes} from './type-equality';

const andSymbol = Symbol('and');
const orSymbol = Symbol('or');
const exactSymbol = Symbol('exact');

const shapeSpecifiersTypes = [
    andSymbol,
    orSymbol,
    exactSymbol,
] as const;

type ShapeSpecifierType = ArrayElement<typeof shapeSpecifiersTypes>;

type ShapeSpecifier<Parts> = {
    [isShapeSpecifierSymbol]: true;
    parts: Parts;
    specifierType: symbol;
};

export type ShapeOr<Part> = ShapeSpecifier<Part, typeof orSymbol>;
export type ShapeAnd<Part> = ShapeSpecifier<Part, typeof andSymbol>;
export type ShapeExact<Part> = ShapeSpecifier<Part, typeof exactSymbol>;

type SpecifierToRunTimeType<
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

export function or<Parts extends AtLeastTuple<any, 1>>(
    ...parts: Parts
): ShapeOr<ArrayElement<Parts>> {
    return specifier(parts, orSymbol);
}

export function and<Parts extends AtLeastTuple<any, 1>>(
    ...parts: Parts
): ShapeAnd<ArrayElement<Parts>> {
    return specifier(parts, andSymbol);
}

export function exact<Part>(part: Part): ShapeExact<Part> {
    return specifier([part], exactSymbol);
}

export function isOrShapeSpecifier(shape: unknown): shape is ShapeOr<unknown> {
    const specifier = getShapeSpecifier(shape);

    return !!specifier && specifier.specifierType === orSymbol;
}

export function isAndShapeSpecifier(shape: unknown): shape is ShapeAnd<unknown> {
    const specifier = getShapeSpecifier(shape);

    return !!specifier && specifier.specifierType === andSymbol;
}

export function isExactShapeSpecifier(shape: unknown): shape is ShapeExact<unknown> {
    const specifier = getShapeSpecifier(shape);

    return !!specifier && specifier.specifierType === exactSymbol;
}

function specifier<Part, Type extends ShapeSpecifierType>(
    parts: AtLeastTuple<Part, 1>,
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

export function matchesSpecifier(subject: unknown, shape: unknown) {
    const specifier = getShapeSpecifier(shape);

    if (specifier) {
        if (specifier.specifierType === andSymbol) {
            return specifier.parts.every((part) => haveEqualTypes(part, subject));
        } else if (specifier.specifierType === orSymbol) {
            return specifier.parts.some((part) => haveEqualTypes(part, subject));
        } else if (specifier.specifierType === exactSymbol) {
            if (isObject(subject)) {
                return haveEqualTypes(specifier.parts[0], subject);
            } else {
                return subject === specifier.parts[0];
            }
        }
    }
    return haveEqualTypes(subject, shape);
}

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

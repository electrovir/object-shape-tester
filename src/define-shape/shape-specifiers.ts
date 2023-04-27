import {
    ArrayElement,
    AtLeastTuple,
    PropertyValueType,
    isObject,
    isRuntimeTypeOf,
    typedArrayIncludes,
    typedHasProperty,
} from '@augment-vir/common';
import {LiteralToPrimitive, Primitive, UnionToIntersection, WritableDeep} from 'type-fest';
import {haveEqualTypes} from './type-equality';

const andSymbol = Symbol('and');
const orSymbol = Symbol('or');
const exactSymbol = Symbol('exact');
const enumSymbol = Symbol('enum');
const unknownSymbol = Symbol('unknown');
export const shapeSymbol = Symbol('shape-marker');

/** This definition has to be in this file because the types circularly depend on each other. */
export type ShapeDefinition<Shape> = {
    shape: Shape;
    runTimeType: ShapeToRunTimeType<Shape>;
    defaultValue: Readonly<ShapeToRunTimeType<Shape>>;
    [shapeSymbol]: true;
};

export function isShapeDefinition(input: unknown): input is ShapeDefinition<unknown> {
    return typedHasProperty(input, shapeSymbol);
}

const isShapeSpecifierSymbol = Symbol('is-shape-specifier');

const shapeSpecifiersTypes = [
    andSymbol,
    orSymbol,
    exactSymbol,
    enumSymbol,
    unknownSymbol,
] as const;

type ShapeSpecifierType = ArrayElement<typeof shapeSpecifiersTypes>;
type BaseParts = AtLeastTuple<unknown, 0>;

type ShapeSpecifier<Parts extends BaseParts, Type extends ShapeSpecifierType> = {
    [isShapeSpecifierSymbol]: true;
    parts: Parts;
    specifierType: Type;
};

export type ShapeOr<Parts extends AtLeastTuple<unknown, 1>> = ShapeSpecifier<
    Parts,
    typeof orSymbol
>;
export type ShapeAnd<Parts extends AtLeastTuple<unknown, 1>> = ShapeSpecifier<
    Parts,
    typeof andSymbol
>;
export type ShapeExact<Parts extends Readonly<AtLeastTuple<unknown, 1>>> = ShapeSpecifier<
    Parts,
    typeof exactSymbol
>;
export type ShapeEnum<Parts extends Readonly<[Record<string, number | string>]>> = ShapeSpecifier<
    Parts,
    typeof enumSymbol
>;
export type ShapeUnknown<Parts extends Readonly<[]>> = ShapeSpecifier<Parts, typeof unknownSymbol>;

type ExpandParts<Parts extends BaseParts> =
    | Exclude<ArrayElement<Parts>, ShapeDefinition<any>>
    | ShapeToRunTimeType<Extract<ArrayElement<Parts>, ShapeDefinition<any>>['shape']>;

type ExpandPart<Part> = Part extends ShapeDefinition<infer Shape>
    ? ShapeToRunTimeType<Shape>
    : Part;

export type SpecifierToRunTimeType<
    PossiblySpecifier,
    IsExact extends boolean = false,
> = PossiblySpecifier extends ShapeSpecifier<infer Parts, infer Type>
    ? Type extends typeof andSymbol
        ? UnionToIntersection<ExpandParts<Parts>>
        : Type extends typeof orSymbol
        ? ExpandParts<Parts>
        : Type extends typeof exactSymbol
        ? WritableDeep<ExpandParts<Parts>>
        : Type extends typeof enumSymbol
        ? WritableDeep<PropertyValueType<ExpandPart<Parts[0]>>>
        : Type extends typeof unknownSymbol
        ? unknown
        : 'TypeError: found not match for shape specifier type.'
    : PossiblySpecifier extends Primitive
    ? IsExact extends true
        ? PossiblySpecifier
        : LiteralToPrimitive<PossiblySpecifier>
    : PossiblySpecifier;

export function or<Parts extends AtLeastTuple<unknown, 1>>(...parts: Parts): ShapeOr<Parts> {
    return specifier(parts, orSymbol);
}

export function and<Parts extends AtLeastTuple<unknown, 1>>(...parts: Parts): ShapeAnd<Parts> {
    return specifier(parts, andSymbol);
}

export function exact<const Parts extends Readonly<AtLeastTuple<unknown, 1>>>(
    ...parts: Parts
): ShapeExact<Parts> {
    return specifier(parts, exactSymbol);
}

export function enumShape<const Parts extends Readonly<[Record<string, number | string>]>>(
    ...parts: Parts
): ShapeEnum<Parts> {
    return specifier(parts, enumSymbol);
}

export function unknownShape(): ShapeUnknown<[]> {
    return specifier([], unknownSymbol);
}

export function isOrShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeOr<AtLeastTuple<unknown, 1>> {
    return specifierHasSymbol(maybeSpecifier, orSymbol);
}

export function isAndShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeAnd<AtLeastTuple<unknown, 1>> {
    return specifierHasSymbol(maybeSpecifier, andSymbol);
}

export function isExactShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeExact<[unknown]> {
    return specifierHasSymbol(maybeSpecifier, exactSymbol);
}

export function isEnumShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeEnum<[Record<string, number | string>]> {
    return specifierHasSymbol(maybeSpecifier, enumSymbol);
}
export function isUnknownShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeUnknown<[]> {
    return specifierHasSymbol(maybeSpecifier, unknownSymbol);
}

function specifierHasSymbol(maybeSpecifier: unknown, symbol: ShapeSpecifierType) {
    const specifier = getShapeSpecifier(maybeSpecifier);

    return !!specifier && specifier.specifierType === symbol;
}

function specifier<Parts extends BaseParts, Type extends ShapeSpecifierType>(
    parts: Parts,
    specifierType: Type,
): ShapeSpecifier<Parts, Type> {
    return {
        [isShapeSpecifierSymbol]: true,
        specifierType,
        parts,
    };
}

export type ShapeToRunTimeType<Shape, IsExact extends boolean = false> = Shape extends object
    ? {
          [PropName in keyof Shape]: Shape[PropName] extends ShapeSpecifier<any, typeof exactSymbol>
              ? ShapeToRunTimeType<SpecifierToRunTimeType<Shape[PropName], true>, true>
              : ShapeToRunTimeType<SpecifierToRunTimeType<Shape[PropName], IsExact>, IsExact>;
      }
    : Shape;

export function matchesSpecifier(subject: unknown, shape: unknown): boolean {
    const specifier = getShapeSpecifier(shape);

    if (specifier) {
        if (isAndShapeSpecifier(specifier)) {
            return specifier.parts.every((part) => matchesSpecifier(subject, part));
        } else if (isOrShapeSpecifier(specifier)) {
            return specifier.parts.some((part) => matchesSpecifier(subject, part));
        } else if (isExactShapeSpecifier(specifier)) {
            if (isObject(subject)) {
                return matchesSpecifier(subject, specifier.parts[0]);
            } else {
                return subject === specifier.parts[0];
            }
        } else if (isEnumShapeSpecifier(specifier)) {
            return Object.values(specifier.parts[0]).some((part) => part === subject);
        } else if (isUnknownShapeSpecifier(specifier)) {
            return true;
        }
    }
    return haveEqualTypes(subject, shape);
}

export function getShapeSpecifier(
    input: unknown,
): ShapeSpecifier<BaseParts, ShapeSpecifierType> | undefined {
    if (!isObject(input)) {
        return undefined;
    }
    if (!typedHasProperty(input, isShapeSpecifierSymbol)) {
        return undefined;
    }

    if (!typedHasProperty(input, 'parts') || !isRuntimeTypeOf(input.parts, 'array')) {
        throw new Error('Found a shape specifier but its parts are not valid.');
    }

    if (
        !typedHasProperty(input, 'specifierType') ||
        !typedArrayIncludes(shapeSpecifiersTypes, input.specifierType)
    ) {
        throw new Error('Found a shape specifier but its specifier type is not valid.');
    }

    return input as ShapeSpecifier<BaseParts, ShapeSpecifierType>;
}

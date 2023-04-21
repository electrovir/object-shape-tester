import {
    ArrayElement,
    AtLeastTuple,
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

const isShapeSpecifierSymbol = Symbol('is-shape-specifier');

const shapeSpecifiersTypes = [
    andSymbol,
    orSymbol,
    exactSymbol,
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

export type SpecifierToRunTimeType<
    PossiblySpecifier,
    IsExact extends boolean = false,
> = PossiblySpecifier extends ShapeSpecifier<infer Parts, infer Type>
    ? Type extends typeof andSymbol
        ? UnionToIntersection<ArrayElement<Parts>>
        : Type extends typeof orSymbol
        ? ArrayElement<Parts>
        : Type extends typeof exactSymbol
        ? WritableDeep<ArrayElement<Parts>>
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

export function isOrShapeSpecifier(shape: unknown): shape is ShapeOr<AtLeastTuple<unknown, 1>> {
    const specifier = getShapeSpecifier(shape);

    return !!specifier && specifier.specifierType === orSymbol;
}

export function isAndShapeSpecifier(shape: unknown): shape is ShapeAnd<AtLeastTuple<unknown, 1>> {
    const specifier = getShapeSpecifier(shape);

    return !!specifier && specifier.specifierType === andSymbol;
}

export function isExactShapeSpecifier(shape: unknown): shape is ShapeExact<[unknown]> {
    const specifier = getShapeSpecifier(shape);

    return !!specifier && specifier.specifierType === exactSymbol;
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

export function matchesSpecifier(subject: unknown, shape: unknown) {
    const specifier = getShapeSpecifier(shape);

    if (specifier) {
        if (isAndShapeSpecifier(specifier)) {
            return specifier.parts.every((part) => haveEqualTypes(part, subject));
        } else if (isOrShapeSpecifier(specifier)) {
            return specifier.parts.some((part) => haveEqualTypes(part, subject));
        } else if (isExactShapeSpecifier(specifier)) {
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
): ShapeSpecifier<BaseParts, ShapeSpecifierType> | undefined {
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

    return input as ShapeSpecifier<BaseParts, ShapeSpecifierType>;
}

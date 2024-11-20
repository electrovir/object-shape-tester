import {
    ArrayElement,
    AtLeastTuple,
    getObjectTypedKeys,
    getObjectTypedValues,
    isEnumValue,
    isObject,
    typedHasProperty,
} from '@augment-vir/common';
import {isPropertyKey, isRunTimeType} from 'run-time-assertions';
import {LiteralToPrimitive, Primitive, UnionToIntersection, WritableDeep} from 'type-fest';
import {haveEqualTypes} from './type-equality';

/**
 * ========================================
 *
 * Shape Definition
 *
 * ========================================
 */
/**
 * This property marks an object as a shape definition.
 *
 * @Internal
 */
export const isShapeDefinitionKey =
    '__vir__shape__definition__key__do__not__use__in__actual__objects' as const;

/** This definition has to be in this file because the types circularly depend on each other. */
export type ShapeDefinition<Shape, IsReadonly extends boolean> = {
    shape: Shape;
    runTimeType: ShapeToRunTimeType<Shape, false, IsReadonly>;
    isReadonly: IsReadonly;
    defaultValue: Readonly<ShapeToRunTimeType<Shape, false, IsReadonly>>;
    [isShapeDefinitionKey]: true;
};

export function isShapeDefinition(input: unknown): input is ShapeDefinition<unknown, false> {
    return typedHasProperty(input, isShapeDefinitionKey);
}

/**
 * ========================================
 *
 * Specifier Symbols
 *
 * ========================================
 */
/**
 * Values used to mark the outputs of each sub-shape function (like {@link or}).
 *
 * @category Internal
 */
export enum ShapeSpecifierType {
    And = 'and',
    Class = 'class',
    Enum = 'enum',
    Exact = 'exact',
    IndexedKeys = 'indexed-keys',
    Or = 'or',
    Unknown = 'unknown',
    NumericRange = 'numeric-range',
    Optional = 'optional',
}

type BaseParts = AtLeastTuple<unknown, 0>;
export const isShapeSpecifierKey =
    '__vir__shape__specifier__key__do__not__use__in__actual__objects' as const;

export type ShapeSpecifier<Parts extends BaseParts, Type extends ShapeSpecifierType> = {
    [isShapeSpecifierKey]: true;
    parts: Parts;
    specifierType: Type;
};

/** Allowed types for keys in the base input for the `indexedKeys` shape. */
export type AllowedIndexKeysKeysSpecifiers =
    | ShapeEnum<Readonly<[Record<string, number | string>]>>
    | ShapeExact<Readonly<AtLeastTuple<PropertyKey, 1>>>
    | ShapeUnknown<[unknown]>
    | PropertyKey;

/** Base type for inputs to the `indexedKeys` shape. */
export type BaseIndexedKeys = {
    keys: ShapeOr<AtLeastTuple<AllowedIndexKeysKeysSpecifiers, 1>> | AllowedIndexKeysKeysSpecifiers;
    values: unknown;
    required: boolean;
};

/**
 * ========================================
 *
 * Shape Types
 *
 * ========================================
 */

export type ShapeAnd<Parts extends AtLeastTuple<unknown, 1>> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.And
>;
export type AnyConstructor = new (...args: any[]) => any;
export type ShapeClass<Parts extends [AnyConstructor]> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.Class
>;
export type ShapeEnum<Parts extends Readonly<[Record<string, number | string>]>> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.Enum
>;
export type ShapeExact<Parts extends Readonly<AtLeastTuple<unknown, 1>>> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.Exact
>;
export type ShapeIndexedKeys<Parts extends Readonly<[BaseIndexedKeys]>> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.IndexedKeys
>;
export type ShapeOr<Parts extends AtLeastTuple<unknown, 1>> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.Or
>;
export type ShapeUnknown<Parts extends Readonly<[unknown]>> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.Unknown
>;

/**
 * ========================================
 *
 * Shape Functions
 *
 * ========================================
 */

export function and<Parts extends AtLeastTuple<unknown, 1>>(...parts: Parts): ShapeAnd<Parts> {
    return specifier(parts, ShapeSpecifierType.And);
}
/** Define a shape that is an instance of the given class constructor. */
export function classShape<Parts extends [AnyConstructor]>(...parts: Parts): ShapeClass<Parts> {
    return specifier(parts, ShapeSpecifierType.Class);
}
export function enumShape<const Parts extends Readonly<[Record<string, number | string>]>>(
    ...parts: Parts
): ShapeEnum<Parts> {
    return specifier(parts, ShapeSpecifierType.Enum);
}
export function exact<const Parts extends Readonly<AtLeastTuple<unknown, 1>>>(
    ...parts: Parts
): ShapeExact<Parts> {
    return specifier(parts, ShapeSpecifierType.Exact);
}
export function indexedKeys<Parts extends Readonly<[BaseIndexedKeys]>>(
    ...parts: Parts
): ShapeIndexedKeys<Parts> {
    return specifier(parts, ShapeSpecifierType.IndexedKeys);
}
export function or<Parts extends AtLeastTuple<unknown, 1>>(...parts: Parts): ShapeOr<Parts> {
    return specifier(parts, ShapeSpecifierType.Or);
}
export function unknownShape(defaultValue?: unknown): ShapeUnknown<[unknown]> {
    return specifier([defaultValue], ShapeSpecifierType.Unknown);
}

/**
 * ========================================
 *
 * Shape Specifier Type Guards
 *
 * ========================================
 */
export function isAndShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeAnd<AtLeastTuple<unknown, 1>> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.And);
}
export function isClassShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeClass<[AnyConstructor]> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.Class);
}
export function isEnumShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeEnum<[Record<string, number | string>]> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.Enum);
}
export function isExactShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeExact<[unknown]> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.Exact);
}
export function isIndexedKeysSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeIndexedKeys<Readonly<[BaseIndexedKeys]>> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.IndexedKeys);
}
export function isOrShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeOr<AtLeastTuple<unknown, 1>> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.Or);
}
export function isUnknownShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeUnknown<[unknown]> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.Unknown);
}

/**
 * ========================================
 *
 * Shape Value Run Time Type
 *
 * ========================================
 */
type ExpandParts<Parts extends BaseParts, IsExact extends boolean, IsReadonly extends boolean> =
    Extract<ArrayElement<Parts>, ShapeDefinition<any, any>> extends never
        ? SpecifierToRunTimeType<ArrayElement<Parts>, IsExact, IsReadonly>
        :
              | SpecifierToRunTimeType<
                    Exclude<ArrayElement<Parts>, ShapeDefinition<any, any>>,
                    IsExact,
                    IsReadonly
                >
              | Extract<ArrayElement<Parts>, ShapeDefinition<any, any>>['runTimeType'];

type MaybeRequired<T, IsPartial extends boolean> = IsPartial extends true
    ? Required<T>
    : Partial<T>;

export type SpecifierToRunTimeType<
    PossiblySpecifier,
    IsExact extends boolean,
    IsReadonly extends boolean,
> =
    PossiblySpecifier extends ShapeSpecifier<infer Parts, infer Type>
        ? Type extends ShapeSpecifierType.And
            ? OptionallyReadonly<
                  IsReadonly,
                  UnionToIntersection<ExpandParts<Parts, IsExact, IsReadonly>>
              >
            : Type extends ShapeSpecifierType.Class
              ? Parts[0] extends AnyConstructor
                  ? OptionallyReadonly<IsReadonly, InstanceType<Parts[0]>>
                  : 'TypeError: classShape input must be a constructor.'
              : Type extends ShapeSpecifierType.Or
                ? OptionallyReadonly<IsReadonly, ExpandParts<Parts, IsExact, IsReadonly>>
                : Type extends ShapeSpecifierType.Exact
                  ? OptionallyReadonly<
                        IsReadonly,
                        WritableDeep<ExpandParts<Parts, true, IsReadonly>>
                    >
                  : Type extends ShapeSpecifierType.Enum
                    ? OptionallyReadonly<IsReadonly, WritableDeep<Parts[0][keyof Parts[0]]>>
                    : Type extends ShapeSpecifierType.IndexedKeys
                      ? Parts[0] extends {keys: unknown; values: unknown; required: boolean}
                          ? ExpandParts<[Parts[0]['keys']], IsExact, IsReadonly> extends PropertyKey
                              ? OptionallyReadonly<
                                    IsReadonly,
                                    MaybeRequired<
                                        Record<
                                            ExpandParts<[Parts[0]['keys']], IsExact, IsReadonly>,
                                            ExpandParts<[Parts[0]['values']], IsExact, IsReadonly>
                                        >,
                                        Parts[0]['required']
                                    >
                                >
                              : 'TypeError: indexedKeys keys be a subset of PropertyKey.'
                          : 'TypeError: indexedKeys input is invalid.'
                      : Type extends ShapeSpecifierType.Unknown
                        ? unknown
                        : 'TypeError: found not match for shape specifier type.'
        : PossiblySpecifier extends Primitive
          ? IsExact extends true
              ? PossiblySpecifier
              : LiteralToPrimitive<PossiblySpecifier>
          : PossiblySpecifier extends object
            ? PossiblySpecifier extends ShapeDefinition<any, any>
                ? PossiblySpecifier['runTimeType']
                : OptionallyReadonly<
                      IsReadonly,
                      {
                          [Prop in keyof PossiblySpecifier]: SpecifierToRunTimeType<
                              PossiblySpecifier[Prop],
                              IsExact,
                              IsReadonly
                          >;
                      }
                  >
            : PossiblySpecifier;

type OptionallyReadonly<IsReadonly extends boolean, OriginalType> = IsReadonly extends true
    ? Readonly<OriginalType>
    : OriginalType;

export type ShapeToRunTimeType<
    Shape,
    IsExact extends boolean,
    IsReadonly extends boolean,
> = Shape extends Function
    ? Shape
    : Shape extends object
      ? Shape extends ShapeDefinition<infer InnerShape, any>
          ? ShapeToRunTimeType<InnerShape, IsExact, IsReadonly>
          : Shape extends ShapeSpecifier<any, any>
            ? Shape extends ShapeSpecifier<any, ShapeSpecifierType.Exact>
                ? SpecifierToRunTimeType<Shape, true, IsReadonly>
                : SpecifierToRunTimeType<Shape, IsExact, IsReadonly>
            : OptionallyReadonly<
                  IsReadonly,
                  {
                      [PropName in keyof Shape]: Shape[PropName] extends ShapeSpecifier<
                          any,
                          ShapeSpecifierType.Exact
                      >
                          ? ShapeToRunTimeType<Shape[PropName], true, IsReadonly>
                          : ShapeToRunTimeType<Shape[PropName], IsExact, IsReadonly>;
                  }
              >
      : Shape;

/**
 * ========================================
 *
 * Specifier Utilities
 *
 * ========================================
 */
export function specifierHasSymbol(maybeSpecifier: unknown, symbol: ShapeSpecifierType) {
    const specifier = getShapeSpecifier(maybeSpecifier);

    return !!specifier && specifier.specifierType === symbol;
}

export function specifier<Parts extends BaseParts, Type extends ShapeSpecifierType>(
    parts: Parts,
    specifierType: Type,
): ShapeSpecifier<Parts, Type> {
    return {
        [isShapeSpecifierKey]: true,
        specifierType,
        parts,
    };
}

export function matchesSpecifier(
    subject: unknown,
    shape: unknown,
    allowExtraKeys?: boolean | undefined,
    checkValues?: boolean | undefined,
): boolean {
    const specifier = getShapeSpecifier(shape);

    if (specifier) {
        if (isClassShapeSpecifier(specifier)) {
            return subject instanceof specifier.parts[0];
        } else if (isAndShapeSpecifier(specifier)) {
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
        } else if (isIndexedKeysSpecifier(specifier)) {
            if (!isObject(subject)) {
                return false;
            }

            return (
                matchesIndexedKeysSpecifierKeys(subject, specifier, !!allowExtraKeys) &&
                getObjectTypedValues(subject).every((subjectValue) =>
                    matchesSpecifier(subjectValue, specifier.parts[0].values),
                )
            );
        } else if (isUnknownShapeSpecifier(specifier)) {
            return true;
        }
    }
    if (checkValues) {
        return shape === subject;
    } else {
        return haveEqualTypes(subject, shape);
    }
}

function matchesIndexedKeysSpecifierKeys(
    subject: object,
    specifier: ShapeIndexedKeys<Readonly<[BaseIndexedKeys]>>,
    allowExtraKeys: boolean,
): boolean {
    const required = specifier.parts[0].required;
    const keys = specifier.parts[0].keys;

    if (!allowExtraKeys) {
        return getObjectTypedKeys(subject).every((subjectKey) =>
            matchesSpecifier(subjectKey, keys),
        );
    } else if (required) {
        const allRequiredKeys = expandIndexedKeysKeys(specifier);

        if (isRunTimeType(allRequiredKeys, 'boolean')) {
            return allRequiredKeys;
        }

        return allRequiredKeys.every((requiredKey) => {
            return getObjectTypedKeys(subject).some((subjectKey) =>
                matchesSpecifier(subjectKey, requiredKey, false, true),
            );
        });
    } else {
        /** No checks necessary in this case. */
        return true;
    }
}

export function expandIndexedKeysKeys(
    specifier: ShapeIndexedKeys<Readonly<[BaseIndexedKeys]>>,
): PropertyKey[] | boolean {
    const keys = specifier.parts[0].keys;

    const nestedSpecifier = getShapeSpecifier(keys);

    if (isPropertyKey(keys)) {
        return [keys];
    } else if (nestedSpecifier) {
        if (isClassShapeSpecifier(nestedSpecifier)) {
            return false;
        } else if (isAndShapeSpecifier(nestedSpecifier)) {
            return false;
        } else if (isOrShapeSpecifier(nestedSpecifier)) {
            const nestedPropertyKeys = nestedSpecifier.parts.map((part) => {
                return expandIndexedKeysKeys(
                    indexedKeys({
                        ...specifier.parts[0],
                        keys: part as any,
                    }),
                );
            });

            let nestedBoolean: boolean | undefined = undefined;
            nestedPropertyKeys.forEach((nested) => {
                if (!isRunTimeType(nested, 'boolean')) {
                    return;
                }
                if (nested && nestedBoolean == undefined) {
                    nestedBoolean = true;
                } else {
                    nestedBoolean = false;
                }
            });

            if (isRunTimeType(nestedBoolean, 'boolean')) {
                return nestedBoolean;
            }

            return nestedPropertyKeys.flat().filter(isPropertyKey);
        } else if (isExactShapeSpecifier(nestedSpecifier)) {
            const propertyKeyParts = nestedSpecifier.parts.filter(isPropertyKey);
            if (propertyKeyParts.length !== nestedSpecifier.parts.length) {
                return false;
            }
            return propertyKeyParts;
        } else if (isEnumShapeSpecifier(nestedSpecifier)) {
            return Object.values(nestedSpecifier.parts[0]);
        } else if (isIndexedKeysSpecifier(nestedSpecifier)) {
            return false;
        } else if (isUnknownShapeSpecifier(nestedSpecifier)) {
            return true;
        }
    }

    return false;
}

export function getShapeSpecifier(
    input: unknown,
): ShapeSpecifier<BaseParts, ShapeSpecifierType> | undefined {
    if (!isObject(input)) {
        return undefined;
    }
    if (!typedHasProperty(input, isShapeSpecifierKey)) {
        return undefined;
    }

    if (!typedHasProperty(input, 'parts') || !isRunTimeType(input.parts, 'array')) {
        throw new Error('Found a shape specifier but its parts are not valid.');
    }

    if (
        !typedHasProperty(input, 'specifierType') ||
        !isEnumValue(input.specifierType, ShapeSpecifierType)
    ) {
        throw new Error('Found a shape specifier but its specifier type is not valid.');
    }

    return input as ShapeSpecifier<BaseParts, ShapeSpecifierType>;
}

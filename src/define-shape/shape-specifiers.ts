import {check} from '@augment-vir/assert';
import {
    ArrayElement,
    AtLeastTuple,
    getObjectTypedKeys,
    getObjectTypedValues,
    type AnyFunction,
} from '@augment-vir/common';
import {LiteralToPrimitive, Primitive, UnionToIntersection, WritableDeep} from 'type-fest';
import {haveEqualTypes} from './type-equality.js';

/**
 * ========================================
 *
 * Shape Definition
 *
 * ========================================
 */
/**
 * A special key string which is used to tag {@link ShapeDefinition} instances so that we know
 * they're shape definitions instead of part of the shape itself.
 *
 * This should be a symbol, but TypeScript errors out about "using names that cannot be named" in
 * that case.
 *
 * @category Internal
 */
export const isShapeDefinitionKey =
    '__vir__shape__definition__key__do__not__use__in__actual__objects';

/**
 * The output of `defineShape`. This is a shape definition which includes the shape itself (used for
 * shape testing), a `runtimeType`, and a `defaultValue`.
 *
 * @category Util
 */
export type ShapeDefinition<Shape, IsReadonly extends boolean> = {
    shape: Shape;
    runtimeType: ShapeToRuntimeType<Shape, false, IsReadonly>;
    isReadonly: IsReadonly;
    defaultValue: Readonly<ShapeToRuntimeType<Shape, false, IsReadonly>>;
    [isShapeDefinitionKey]: true;
};

/**
 * Checks if the given input is a {@link isShapeDefinition}.
 *
 * @category Util
 */
export function isShapeDefinition(input: unknown): input is ShapeDefinition<unknown, false> {
    return check.hasKey(input, isShapeDefinitionKey);
}

/**
 * ========================================
 *
 * Specifier Symbols
 *
 * ========================================
 */
const andSymbol = Symbol('and');
const classSymbol = Symbol('instance');
const enumSymbol = Symbol('enum');
const exactSymbol = Symbol('exact');
const indexedKeysSymbol = Symbol('indexed-keys');
const orSymbol = Symbol('or');
const unknownSymbol = Symbol('unknown');

/**
 * Symbols used to mark the outputs of each sub-shape function (like {@link or}).
 *
 * @category Internal
 */
export const shapeSpecifiersTypes = [
    andSymbol,
    enumSymbol,
    exactSymbol,
    indexedKeysSymbol,
    classSymbol,
    orSymbol,
    unknownSymbol,
] as const;

type BaseParts = AtLeastTuple<unknown, 0>;
/**
 * A special key string which is used to tag {@link ShapeSpecifier} instances so that we know they're
 * shape shape specifiers instead of part of the shape itself.
 *
 * This should be a symbol, but TypeScript errors out about "using names that cannot be named" in
 * that case.
 *
 * @category Internal
 */
export const isShapeSpecifierKey =
    '__vir__shape__specifier__key__do__not__use__in__actual__objects';
type ShapeSpecifierType = ArrayElement<typeof shapeSpecifiersTypes>;

/**
 * Output from the sub-shape defining functions (such as {@link or}).
 *
 * @category Internal
 */
export type ShapeSpecifier<Parts extends BaseParts, Type extends ShapeSpecifierType> = {
    [isShapeSpecifierKey]: true;
    parts: Parts;
    specifierType: Type;
};

/**
 * Allowed types for keys in the base input for the `indexedKeys` shape.
 *
 * @category Internal
 */
export type AllowedIndexKeysKeysSpecifiers =
    | ShapeEnum<Readonly<[Record<string, number | string>]>>
    | ShapeExact<Readonly<AtLeastTuple<PropertyKey, 1>>>
    | ShapeUnknown<[unknown]>
    | PropertyKey;

/**
 * Base type for inputs to the `indexedKeys` shape.
 *
 * @category Internal
 */
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

/**
 * {@link ShapeSpecifier} for {@link and}.
 *
 * @category Internal
 */
export type ShapeAnd<Parts extends AtLeastTuple<unknown, 1>> = ShapeSpecifier<
    Parts,
    typeof andSymbol
>;
/**
 * Helper type for {@link ShapeClass}.
 *
 * @category Internal
 */
export type AnyConstructor = new (...args: any[]) => any;
/**
 * {@link ShapeSpecifier} for {@link classShape}.
 *
 * @category Internal
 */
export type ShapeClass<Parts extends [AnyConstructor]> = ShapeSpecifier<Parts, typeof classSymbol>;
/**
 * {@link ShapeSpecifier} for {@link enumShape}.
 *
 * @category Internal
 */
export type ShapeEnum<Parts extends Readonly<[Record<string, number | string>]>> = ShapeSpecifier<
    Parts,
    typeof enumSymbol
>;
/**
 * {@link ShapeSpecifier} for {@link exact}.
 *
 * @category Internal
 */
export type ShapeExact<Parts extends Readonly<AtLeastTuple<unknown, 1>>> = ShapeSpecifier<
    Parts,
    typeof exactSymbol
>;
/**
 * {@link ShapeSpecifier} for {@link indexedKeys}.
 *
 * @category Internal
 */
export type ShapeIndexedKeys<Parts extends Readonly<[BaseIndexedKeys]>> = ShapeSpecifier<
    Parts,
    typeof indexedKeysSymbol
>;
/**
 * {@link ShapeSpecifier} for {@link or}.
 *
 * @category Internal
 */
export type ShapeOr<Parts extends AtLeastTuple<unknown, 1>> = ShapeSpecifier<
    Parts,
    typeof orSymbol
>;
/**
 * {@link ShapeSpecifier} for {@link unknownShape}.
 *
 * @category Internal
 */
export type ShapeUnknown<Parts extends Readonly<[unknown]>> = ShapeSpecifier<
    Parts,
    typeof unknownSymbol
>;

/**
 * ========================================
 *
 * Shape Functions
 *
 * ========================================
 */

/**
 * Create a shape part that combines all of its inputs together with an intersection or "and".
 *
 * @category Shape Part
 * @example
 *
 * ```ts
 * import {and, defineShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: and({q: ''}, {r: -1}, {s: true}),
 * });
 *
 * // `myShape.runtimeType` is `{a: {q: string, r: number, s: boolean}}`
 * ```
 */
export function and<Parts extends AtLeastTuple<unknown, 1>>(...parts: Parts): ShapeAnd<Parts> {
    return specifier(parts, andSymbol);
}
/**
 * Define a shape part that requires an instance of the given constructor.
 *
 * @category Shape Part
 * @example
 *
 * ```ts
 * import {classShape, defineShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: classShape(RegExp),
 * });
 *
 * // `myShape.runtimeType` is `{a: RegExp}`
 * ```
 */
export function classShape<Parts extends [AnyConstructor]>(...parts: Parts): ShapeClass<Parts> {
    return specifier(parts, classSymbol);
}
/**
 * Define a shape part that requires an enum value.
 *
 * @category Shape Part
 * @example
 *
 * ```ts
 * import {enumShape, defineShape} from 'object-shape-tester';
 *
 * enum MyEnum {
 *     A = 'a',
 *     B = 'b',
 * }
 *
 * const myShape = defineShape({
 *     a: enumShape(MyEnum),
 * });
 *
 * // `myShape.runtimeType` is `{a: MyEnum}`
 * ```
 */
export function enumShape<const Parts extends Readonly<[Record<string, number | string>]>>(
    ...parts: Parts
): ShapeEnum<Parts> {
    return specifier(parts, enumSymbol);
}
/**
 * Define a shape part that requires _exactly_ the value given.
 *
 * @category Shape Part
 * @example
 *
 * ```ts
 * import {exact, defineShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: or(exact('hi'), exact('bye')),
 * });
 *
 * // `myShape.runtimeType` is `{a: 'hi' | 'bye'}`
 * ```
 */
export function exact<const Parts extends Readonly<AtLeastTuple<unknown, 1>>>(
    ...parts: Parts
): ShapeExact<Parts> {
    return specifier(parts, exactSymbol);
}
/**
 * Define a shape part that's an object with a specific set of keys and values.
 *
 * @category Shape Part
 * @example
 *
 * ```ts
 * import {exact, defineShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: indexedKeys({
 *         keys: or(exact('hi'), exact('bye')),
 *         values: {
 *             helloThere: 0,
 *         },
 *         required: false,
 *     }),
 * });
 *
 * // `myShape.runtimeType` is `{a: Partial<Record<'hi' | 'bye', {helloThere: number}>>}`
 * ```
 */
export function indexedKeys<Parts extends Readonly<[BaseIndexedKeys]>>(
    ...parts: Parts
): ShapeIndexedKeys<Parts> {
    return specifier(parts, indexedKeysSymbol);
}
/**
 * Define a shape part that's a union of all its inputs.
 *
 * @category Shape Part
 * @example
 *
 * ```ts
 * import {or, defineShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: or('', -1),
 * });
 *
 * // `myShape.runtimeType` is `{a: string | number}`
 * ```
 */
export function or<Parts extends AtLeastTuple<unknown, 1>>(...parts: Parts): ShapeOr<Parts> {
    return specifier(parts, orSymbol);
}
/**
 * Define a shape part that resolves simply to `unknown`.
 *
 * @category Shape Part
 * @example
 *
 * ```ts
 * import {unknownShape, defineShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: unknownShape,
 * });
 *
 * // `myShape.runtimeType` is `{a: unknown`
 * ```
 */
export function unknownShape(defaultValue?: unknown): ShapeUnknown<[unknown]> {
    return specifier([defaultValue], unknownSymbol);
}

/**
 * ========================================
 *
 * Shape Specifier Type Guards
 *
 * ========================================
 */
/**
 * Checks if the input is an `and` shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isAndShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeAnd<AtLeastTuple<unknown, 1>> {
    return specifierHasSymbol(maybeSpecifier, andSymbol);
}
/**
 * Checks if the input is a `classShape` shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isClassShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeClass<[AnyConstructor]> {
    return specifierHasSymbol(maybeSpecifier, classSymbol);
}
/**
 * Checks if the input is an `enumShape` shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isEnumShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeEnum<[Record<string, number | string>]> {
    return specifierHasSymbol(maybeSpecifier, enumSymbol);
}

/**
 * Checks if the input is an `exact` shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isExactShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeExact<[unknown]> {
    return specifierHasSymbol(maybeSpecifier, exactSymbol);
}

/**
 * Checks if the input is an `indexedKeys` shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isIndexedKeysSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeIndexedKeys<Readonly<[BaseIndexedKeys]>> {
    return specifierHasSymbol(maybeSpecifier, indexedKeysSymbol);
}

/**
 * Checks if the input is an `or` shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isOrShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeOr<AtLeastTuple<unknown, 1>> {
    return specifierHasSymbol(maybeSpecifier, orSymbol);
}

/**
 * Checks if the input is an `unknown` shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isUnknownShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeUnknown<[unknown]> {
    return specifierHasSymbol(maybeSpecifier, unknownSymbol);
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
        ? SpecifierToRuntimeType<ArrayElement<Parts>, IsExact, IsReadonly>
        :
              | SpecifierToRuntimeType<
                    Exclude<ArrayElement<Parts>, ShapeDefinition<any, any>>,
                    IsExact,
                    IsReadonly
                >
              | Extract<ArrayElement<Parts>, ShapeDefinition<any, any>>['runtimeType'];

type MaybeRequired<T, IsPartial extends boolean> = IsPartial extends true
    ? Required<T>
    : Partial<T>;

/**
 * Converts a shape specifier to a runtime type.
 *
 * @category Internal
 */
export type SpecifierToRuntimeType<
    PossiblySpecifier,
    IsExact extends boolean,
    IsReadonly extends boolean,
> =
    PossiblySpecifier extends ShapeSpecifier<infer Parts, infer Type>
        ? Type extends typeof andSymbol
            ? OptionallyReadonly<
                  IsReadonly,
                  UnionToIntersection<ExpandParts<Parts, IsExact, IsReadonly>>
              >
            : Type extends typeof classSymbol
              ? Parts[0] extends AnyConstructor
                  ? OptionallyReadonly<IsReadonly, InstanceType<Parts[0]>>
                  : 'TypeError: classShape input must be a constructor.'
              : Type extends typeof orSymbol
                ? OptionallyReadonly<IsReadonly, ExpandParts<Parts, IsExact, IsReadonly>>
                : Type extends typeof exactSymbol
                  ? OptionallyReadonly<
                        IsReadonly,
                        WritableDeep<ExpandParts<Parts, true, IsReadonly>>
                    >
                  : Type extends typeof enumSymbol
                    ? OptionallyReadonly<IsReadonly, Parts[0][keyof Parts[0]]>
                    : Type extends typeof indexedKeysSymbol
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
                      : Type extends typeof unknownSymbol
                        ? unknown
                        : 'TypeError: found not match for shape specifier type.'
        : PossiblySpecifier extends Primitive
          ? IsExact extends true
              ? PossiblySpecifier
              : LiteralToPrimitive<PossiblySpecifier>
          : PossiblySpecifier extends object
            ? PossiblySpecifier extends ShapeDefinition<any, any>
                ? PossiblySpecifier['runtimeType']
                : OptionallyReadonly<
                      IsReadonly,
                      {
                          [Prop in keyof PossiblySpecifier]: SpecifierToRuntimeType<
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

/**
 * Converts a shape definition to a runtime type.
 *
 * @category Util
 */
export type ShapeToRuntimeType<
    Shape,
    IsExact extends boolean,
    IsReadonly extends boolean,
> = Shape extends AnyFunction
    ? Shape
    : Shape extends object
      ? Shape extends ShapeDefinition<infer InnerShape, any>
          ? ShapeToRuntimeType<InnerShape, IsExact, IsReadonly>
          : Shape extends ShapeSpecifier<any, any>
            ? Shape extends ShapeSpecifier<any, typeof exactSymbol>
                ? SpecifierToRuntimeType<Shape, true, IsReadonly>
                : SpecifierToRuntimeType<Shape, IsExact, IsReadonly>
            : OptionallyReadonly<
                  IsReadonly,
                  {
                      [PropName in keyof Shape]: Shape[PropName] extends ShapeSpecifier<
                          any,
                          typeof exactSymbol
                      >
                          ? ShapeToRuntimeType<Shape[PropName], true, IsReadonly>
                          : ShapeToRuntimeType<Shape[PropName], IsExact, IsReadonly>;
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
function specifierHasSymbol(maybeSpecifier: unknown, symbol: ShapeSpecifierType) {
    const specifier = getShapeSpecifier(maybeSpecifier);

    return !!specifier && specifier.specifierType === symbol;
}

function specifier<Parts extends BaseParts, Type extends ShapeSpecifierType>(
    parts: Parts,
    specifierType: Type,
): ShapeSpecifier<Parts, Type> {
    return {
        [isShapeSpecifierKey]: true,
        specifierType,
        parts,
    };
}

/**
 * Checks if the given `subject` matches the given `shape`.
 *
 * @category Internal
 */
export function matchesShape(
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
            return specifier.parts.every((part) => matchesShape(subject, part));
        } else if (isOrShapeSpecifier(specifier)) {
            return specifier.parts.some((part) => matchesShape(subject, part));
        } else if (isExactShapeSpecifier(specifier)) {
            if (check.isObject(subject)) {
                return matchesShape(subject, specifier.parts[0]);
            } else {
                return subject === specifier.parts[0];
            }
        } else if (isEnumShapeSpecifier(specifier)) {
            return check.hasValue(Object.values(specifier.parts[0]), subject);
        } else if (isIndexedKeysSpecifier(specifier)) {
            if (!check.isObject(subject)) {
                return false;
            }

            return (
                matchesIndexedKeysSpecifierKeys(subject, specifier, !!allowExtraKeys) &&
                getObjectTypedValues(subject).every((subjectValue) =>
                    matchesShape(subjectValue, specifier.parts[0].values),
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
        return getObjectTypedKeys(subject).every((subjectKey) => matchesShape(subjectKey, keys));
    } else if (required) {
        const allRequiredKeys = expandIndexedKeysKeys(specifier);

        if (check.isBoolean(allRequiredKeys)) {
            return allRequiredKeys;
        }

        return allRequiredKeys.every((requiredKey) => {
            return getObjectTypedKeys(subject).some((subjectKey) =>
                matchesShape(subjectKey, requiredKey, false, true),
            );
        });
    } else {
        /** No checks necessary in this case. */
        return true;
    }
}

/**
 * Expands an {@link indexedKeys} shape part into an array of its valid keys.
 *
 * @category Internal
 * @returns `true` if any keys are allowed. `false` if a bounded set of keys cannot be determined.
 */
export function expandIndexedKeysKeys(
    specifier: ShapeIndexedKeys<Readonly<[BaseIndexedKeys]>>,
): PropertyKey[] | boolean {
    const keys = specifier.parts[0].keys;

    const nestedSpecifier = getShapeSpecifier(keys);

    if (check.isPropertyKey(keys)) {
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
                if (!check.isBoolean(nested)) {
                    return;
                }
                if (nested && nestedBoolean == undefined) {
                    nestedBoolean = true;
                } else {
                    nestedBoolean = false;
                }
            });

            if (check.isBoolean(nestedBoolean)) {
                return nestedBoolean;
            }

            return nestedPropertyKeys.flat().filter(check.isPropertyKey);
        } else if (isExactShapeSpecifier(nestedSpecifier)) {
            const propertyKeyParts = nestedSpecifier.parts.filter(check.isPropertyKey);
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

/**
 * If the input is a shape specifier, return it type guarded as such.
 *
 * @category Internal
 * @returns `undefined` if the input is not
 */
export function getShapeSpecifier(
    input: unknown,
): ShapeSpecifier<BaseParts, ShapeSpecifierType> | undefined {
    if (!check.isObject(input)) {
        return undefined;
    }
    if (!check.hasKey(input, isShapeSpecifierKey)) {
        return undefined;
    }

    if (!check.hasKey(input, 'parts') || !check.isArray(input.parts)) {
        throw new Error('Found a shape specifier but its parts are not valid.');
    }

    if (
        !check.hasKey(input, 'specifierType') ||
        !check.hasValue(shapeSpecifiersTypes, input.specifierType)
    ) {
        throw new Error('Found a shape specifier but its specifier type is not valid.');
    }

    return input as ShapeSpecifier<BaseParts, ShapeSpecifierType>;
}

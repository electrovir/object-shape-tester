import {check} from '@augment-vir/assert';
import {
    ArrayElement,
    AtLeastTuple,
    getObjectTypedKeys,
    getObjectTypedValues,
    type AnyFunction,
} from '@augment-vir/common';
import {
    Primitive,
    UnionToIntersection,
    WritableDeep,
    type IsEqual,
    type IsNever,
    type LiteralToPrimitive,
    type Simplify,
} from 'type-fest';
import {isCustomSpecifier, type CustomSpecifier} from './custom-specifier.js';
import {isShapeDefinitionKey, isShapeSpecifierKey} from './shape-keys.js';
import {haveEqualTypes} from './type-equality.js';

/**
 * ========================================
 *
 * Shape Definition
 *
 * ========================================
 */

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
    Tuple = 'tuple',
}
/** @category Internal */
export type BaseParts = AtLeastTuple<unknown, 0>;

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
    | PropertyKey
    | CustomSpecifier<any>;

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
    ShapeSpecifierType.And
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
export type ShapeClass<Parts extends [AnyConstructor]> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.Class
>;
/**
 * {@link ShapeSpecifier} for {@link enumShape}.
 *
 * @category Internal
 */
export type ShapeEnum<
    Parts extends Readonly<[Record<string, number | string>, (number | string)?]>,
> = ShapeSpecifier<Parts, ShapeSpecifierType.Enum>;
/**
 * {@link ShapeSpecifier} for {@link exact}.
 *
 * @category Internal
 */
export type ShapeExact<Parts extends Readonly<AtLeastTuple<unknown, 1>>> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.Exact
>;
/**
 * {@link ShapeSpecifier} for {@link indexedKeys}.
 *
 * @category Internal
 */
export type ShapeIndexedKeys<Parts extends Readonly<[BaseIndexedKeys]>> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.IndexedKeys
>;
/**
 * {@link ShapeSpecifier} for {@link tupleShape}.
 *
 * @category Internal
 */
export type ShapeTuple<Parts extends Readonly<any[]>> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.Tuple
>;
/**
 * {@link ShapeSpecifier} for {@link or}.
 *
 * @category Internal
 */
export type ShapeOr<Parts extends AtLeastTuple<unknown, 1>> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.Or
>;
/**
 * {@link ShapeSpecifier} for {@link unknownShape}.
 *
 * @category Internal
 */
export type ShapeUnknown<Parts extends Readonly<[unknown]>> = ShapeSpecifier<
    Parts,
    ShapeSpecifierType.Unknown
>;
/**
 * {@link ShapeSpecifier} for {@link numericRange}.
 *
 * @category Internal
 */
export type ShapeNumericRange<T extends number = number> = ShapeSpecifier<
    [T, T],
    ShapeSpecifierType.NumericRange
>;
/**
 * {@link ShapeSpecifier} for {@link optional}.
 *
 * @category Internal
 */
export type ShapeOptional<T = unknown> = ShapeSpecifier<[T], ShapeSpecifierType.Optional>;

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
    return specifier(parts, ShapeSpecifierType.And);
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
    return specifier(parts, ShapeSpecifierType.Class);
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
export function enumShape<
    const Parts extends Readonly<[Record<string, number | string>, (number | string)?]>,
>(...parts: Parts): ShapeEnum<Parts> {
    return specifier(parts, ShapeSpecifierType.Enum);
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
    return specifier(parts, ShapeSpecifierType.Exact);
}
/**
 * Define a shape part that's an object with a specific set of keys and values.
 *
 * @category Shape Part
 * @example
 *
 * ```ts
 * import {exact, defineShape, indexedKeys} from 'object-shape-tester';
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
    return specifier(parts, ShapeSpecifierType.IndexedKeys);
}
/**
 * Define a shape part requires a tuple.
 *
 * @category Shape Part
 * @example
 *
 * ```ts
 * import {exact, defineShape, tupleShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: tupleShape('a', -1, exact('hi')),
 * });
 *
 * // `myShape.runtimeType` is `[string, number, 'hi']`
 * ```
 */
export function tupleShape<Parts extends Readonly<any[]>>(...parts: Parts): ShapeTuple<Parts> {
    return specifier(parts, ShapeSpecifierType.Tuple);
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
    return specifier(parts, ShapeSpecifierType.Or);
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
 * // `myShape.runtimeType` is `{a: unknown}`
 * ```
 */
export function unknownShape(defaultValue?: unknown): ShapeUnknown<[unknown]> {
    return specifier([defaultValue], ShapeSpecifierType.Unknown);
}
/**
 * Define a shape part that requires numbers to be within a specific range, inclusive.
 *
 * @category Shape Part
 * @example
 *
 * ```ts
 * import {numericRange, defineShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     // This will simply produce a type of `number` but will validate runtime values against the range.
 *     a: numericRange(1, 10),
 * });
 * // `myShape.runtimeType` is just `{a: number}`
 *
 * const myShape2 = defineShape({
 *     // If you want type safety, you must specify the allowed numbers manually
 *     a: numericRange<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10>(1, 10),
 * });
 * // `myShape2.runtimeType` is `{a: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`
 * ```
 */
export function numericRange<T extends number = number>(
    min: NoInfer<T>,
    max: NoInfer<T>,
): ShapeNumericRange<T> {
    return specifier(
        [
            min,
            max,
        ],
        ShapeSpecifierType.NumericRange,
    );
}
/**
 * Define a shape part that is optional. This only makes sense as a property in an object.
 *
 * @category Shape Part
 * @example
 *
 * ```ts
 * import {optional, defineShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: optional(-1),
 * });
 *
 * // `myShape.runtimeType` is `{a?: number}`
 * ```
 */
export function optional<T>(part: T): ShapeOptional<T> {
    return specifier([part], ShapeSpecifierType.Optional);
}

/**
 * ========================================
 *
 * Shape Specifier Type Guards
 *
 * ========================================
 */
/**
 * Checks if the input is an {@link and} shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isAndShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeAnd<AtLeastTuple<unknown, 1>> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.And);
}
/**
 * Checks if the input is a {@link classShape} shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isClassShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeClass<[AnyConstructor]> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.Class);
}
/**
 * Checks if the input is an {@link enumShape} shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isEnumShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeEnum<[Record<string, number | string>, (number | string)?]> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.Enum);
}

/**
 * Checks if the input is an {@link exact} shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isExactShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeExact<[unknown]> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.Exact);
}

/**
 * Checks if the input is an {@link indexedKeys} shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isIndexedKeysSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeIndexedKeys<Readonly<[BaseIndexedKeys]>> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.IndexedKeys);
}

/**
 * Checks if the input is an {@link tupleShape} shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isTupleShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeTuple<Readonly<any[]>> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.Tuple);
}

/**
 * Checks if the input is an {@link or} shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isOrShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeOr<AtLeastTuple<unknown, 1>> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.Or);
}

/**
 * Checks if the input is an {@link unknownShape} shape specifier for internal type guarding
 * purposes.
 *
 * @category Internal
 */
export function isUnknownShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeUnknown<[unknown]> {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.Unknown);
}

/**
 * Checks if the input is a {@link numericRange} shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isNumericRangeShapeSpecifier(
    maybeSpecifier: unknown,
): maybeSpecifier is ShapeNumericRange {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.NumericRange);
}

/**
 * Checks if the input is a {@link optional} shape specifier for internal type guarding purposes.
 *
 * @category Internal
 */
export function isOptionalShapeSpecifier(maybeSpecifier: unknown): maybeSpecifier is ShapeOptional {
    return specifierHasSymbol(maybeSpecifier, ShapeSpecifierType.Optional);
}

/**
 * ========================================
 *
 * Shape Value Run Time Type
 *
 * ========================================
 */
/** @category Internal */
export type ExpandParts<
    Parts extends BaseParts,
    IsExact extends boolean,
    IsReadonly extends boolean,
> =
    Extract<ArrayElement<Parts>, ShapeDefinition<any, any>> extends never
        ? ShapeToRuntimeType<ArrayElement<Parts>, IsExact, IsReadonly>
        :
              | ShapeToRuntimeType<
                    Exclude<ArrayElement<Parts>, ShapeDefinition<any, any>>,
                    IsExact,
                    IsReadonly
                >
              | Extract<ArrayElement<Parts>, ShapeDefinition<any, any>>['runtimeType'];

type MaybePartial<T, IsPartial extends boolean> = IsPartial extends true ? T : Partial<T>;

/** @category Internal */
export type TupleParts<
    Parts extends ReadonlyArray<any>,
    IsExact extends boolean,
    IsReadonly extends boolean,
> = {
    [Index in keyof Parts]: SpecifierToRuntimeType<Parts[Index], IsExact, IsReadonly>;
};

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
        ? Type extends ShapeSpecifierType.NumericRange
            ? Parts[0]
            : Type extends ShapeSpecifierType.And
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
                      ? OptionallyReadonly<IsReadonly, Parts[0][keyof Parts[0]]>
                      : Type extends ShapeSpecifierType.IndexedKeys
                        ? Parts[0] extends {keys: unknown; values: unknown; required: boolean}
                            ? ExpandParts<
                                  [Parts[0]['keys']],
                                  IsExact,
                                  IsReadonly
                              > extends PropertyKey
                                ? OptionallyReadonly<
                                      IsReadonly,
                                      MaybePartial<
                                          Record<
                                              ExpandParts<[Parts[0]['keys']], IsExact, IsReadonly>,
                                              ExpandParts<[Parts[0]['values']], IsExact, IsReadonly>
                                          >,
                                          Parts[0]['required']
                                      >
                                  >
                                : 'TypeError: indexedKeys keys be a subset of PropertyKey.'
                            : 'TypeError: indexedKeys input is invalid.'
                        : Type extends ShapeSpecifierType.Tuple
                          ? TupleParts<Parts, IsExact, IsReadonly>
                          : Type extends ShapeSpecifierType.Unknown
                            ? unknown
                            : Type extends ShapeSpecifierType.Optional
                              ? ExpandParts<Parts, IsExact, IsReadonly>
                              : 'TypeError: found no match for shape specifier type.'
        : PossiblySpecifier extends Primitive
          ? IsExact extends true
              ? PossiblySpecifier
              : PossiblySpecifier
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

/** @category Internal */
export type OptionallyReadonly<IsReadonly extends boolean, OriginalType> = IsReadonly extends true
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
    : Shape extends CustomSpecifier<infer T>
      ? T
      : Shape extends object
        ? Shape extends ShapeDefinition<infer InnerShape, any>
            ? ShapeToRuntimeType<InnerShape, IsExact, IsReadonly>
            : Shape extends ShapeSpecifier<any, any>
              ? Shape extends ShapeSpecifier<any, ShapeSpecifierType.Exact>
                  ? SpecifierToRuntimeType<Shape, true, IsReadonly>
                  : SpecifierToRuntimeType<Shape, IsExact, IsReadonly>
              : Shape extends Array<any>
                ? OptionallyReadonly<
                      IsReadonly,
                      {
                          [Prop in keyof Shape]: Shape[Prop] extends ShapeSpecifier<
                              any,
                              ShapeSpecifierType.Exact
                          >
                              ? ShapeToRuntimeType<Shape[Prop], true, IsReadonly>
                              : ShapeToRuntimeType<Shape[Prop], IsExact, IsReadonly>;
                      }
                  >
                : OptionallyReadonly<
                      IsReadonly,
                      Simplify<
                          {
                              [Prop in keyof Shape as Shape[Prop] extends ShapeOptional<any>
                                  ? never
                                  : Prop]: Shape[Prop] extends ShapeOptional<any>
                                  ? never
                                  : Shape[Prop] extends ShapeSpecifier<
                                          any,
                                          ShapeSpecifierType.Exact
                                      >
                                    ? ShapeToRuntimeType<Shape[Prop], true, IsReadonly>
                                    : ShapeToRuntimeType<Shape[Prop], IsExact, IsReadonly>;
                          } & {
                              [Prop in keyof Shape as Shape[Prop] extends ShapeOptional<any>
                                  ? Prop
                                  : never]?: Shape[Prop] extends ShapeOptional<any>
                                  ? Shape[Prop] extends ShapeSpecifier<
                                        any,
                                        ShapeSpecifierType.Exact
                                    >
                                      ? ShapeToRuntimeType<Shape[Prop], true, IsReadonly>
                                      : ShapeToRuntimeType<Shape[Prop], IsExact, IsReadonly>
                                  : never;
                          }
                      >
                  >
        : IsEqual<IsExact, true> extends true
          ? Shape
          : IsNever<LiteralToPrimitive<Shape>> extends true
            ? Shape
            : LiteralToPrimitive<Shape>;

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
        if (isCustomSpecifier(specifier)) {
            return specifier.checker(subject);
        } else if (isNumericRangeShapeSpecifier(specifier)) {
            if (!check.isNumber(subject)) {
                return false;
            }
            return subject >= specifier.parts[0] && subject <= specifier.parts[1];
        } else if (isClassShapeSpecifier(specifier)) {
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
            const matchesKeys = matchesIndexedKeysSpecifierKeys(
                subject,
                specifier,
                !!allowExtraKeys,
            );
            const matchesValues = getObjectTypedValues(subject).every((subjectValue) =>
                matchesShape(subjectValue, specifier.parts[0].values),
            );

            return matchesKeys && matchesValues;
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

    const allRequiredKeys = expandIndexedKeysKeys(specifier);

    if (check.isBoolean(allRequiredKeys)) {
        return getObjectTypedKeys(subject).every((subjectKey) => {
            return matchesShape(subjectKey, keys);
        });
    }

    const matchesRequiredKeys: boolean = required
        ? allRequiredKeys.every((requiredKey) => {
              return getObjectTypedKeys(subject).some((subjectKey) =>
                  matchesShape(subjectKey, requiredKey, false, true),
              );
          })
        : true;

    const matchesExistingKeys: boolean = getObjectTypedKeys(subject).every((subjectKey) => {
        const isExpectedKey = allRequiredKeys.includes(subjectKey);

        if (isExpectedKey) {
            return matchesShape(subjectKey, keys);
        } else {
            return allowExtraKeys;
        }
    });

    return matchesExistingKeys && matchesRequiredKeys;
}

/**
 * Expands an {@link indexedKeys} shape part into an array of its valid keys.
 *
 * @category Internal
 * @returns `true` if any keys are allowed. `false` if a bounded set of keys cannot be determined.
 *   `PropertyKey[]` if there's a specific set of keys that can be extracted.
 */
export function expandIndexedKeysKeys(
    specifier: ShapeIndexedKeys<Readonly<[BaseIndexedKeys]>>,
): PropertyKey[] | boolean {
    const keys = specifier.parts[0].keys;

    const nestedSpecifier = getShapeSpecifier(keys);

    if (check.isPropertyKey(keys)) {
        return true;
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

            if (nestedPropertyKeys.includes(false)) {
                return false;
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
    if (!check.isObject(input) || !check.hasKey(input, isShapeSpecifierKey)) {
        return undefined;
    }

    return input as ShapeSpecifier<BaseParts, ShapeSpecifierType>;
}

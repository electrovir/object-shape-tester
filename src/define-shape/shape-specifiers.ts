import {type AtLeastTuple} from '@augment-vir/common';
import {type CustomSpecifier} from './custom-specifier.js';
import {type isShapeSpecifierKey} from './shape-keys.js';

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
    IndexedKeys = 'indexed-keys',
    NumericRange = 'numeric-range',
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

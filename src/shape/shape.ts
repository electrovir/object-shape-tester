import {assert, check} from '@augment-vir/assert';
import {stringify, type AnyFunction, type AnyObject} from '@augment-vir/common';
import {
    Kind,
    Type,
    type Static,
    type TArray,
    type TBigInt,
    type TBoolean,
    type TNull,
    type TNumber,
    type TObject,
    type TProperties,
    type TSchema,
    type TString,
    type TSymbol,
    type TUndefined,
    type TUnsafe,
} from '@sinclair/typebox';
import {TypeCompiler, type TypeCheck} from '@sinclair/typebox/compiler';
import {type IsAny, type IsUnknown} from 'type-fest';
import {setShapeDefinitionErrorMessage} from '../errors/error-message.js';

/**
 * Output of {@link defineShape}.
 *
 * @category Internal
 */
export type Shape<Init = any> = {
    default: ShapeInitDefault<Init>;
    $_schema: ShapeInitSchema<Init>;
    $_schemaNoExtraKeys: ShapeInitSchema<Init>;
    $_schemaExtraKeys: ShapeInitSchema<Init>;
    $_compiledSchema: TypeCheck<any>;
    $_compiledSchemaNoExtraKeys: TypeCheck<any>;
    $_compiledSchemaExtraKeys: TypeCheck<any>;
    runtimeType: ShapeInitType<Init>;
};

/**
 * A special key string which is used to tag {@link Shape} instances so that we know they're shapes
 * instead of part of the shape itself.
 *
 * We don't use `instanceof` with a Class constructor for this because that breaks when you have
 * multiple versions of object-shape-tester defining and consuming shapes.
 *
 * @category Internal
 */
export const shapeIdentifier = Symbol.for('object-shape-tester.shape-identifier');

/**
 * A type for defining a shape definition with a direct type definition.
 *
 * @category Internal
 */
export type UnsafeShape<T> = Shape<TUnsafe<T>>;

/**
 * A helper for defining a shape while also immediately providing the type for that shape's values.
 *
 * @category Internal
 */
export function unsafeShape<T>(init: any): UnsafeShape<T> {
    return defineShape(init) as UnsafeShape<T>;
}

/**
 * Defines a shape from the given init.
 *
 * @category Define
 */
export function defineShape<Init = any>(init: Init): Shape<Init> {
    setShapeDefinitionErrorMessage();
    if (isShape(init)) {
        /**
         * If `init` is already a {@link Shape}, don't construct a new {@link Shape} instance, just
         * return the original one.
         */
        return init;
    }

    const schema = shapeInitToSchema(init) as ShapeInitSchema<Init>;
    const schemaNoExtraKeys = forceAdditionalProperties(schema, false);
    const schemaExtraKeys = forceAdditionalProperties(schema, true);

    const shape: Omit<Shape<Init>, 'runtimeType' | typeof shapeIdentifier> = {
        $_schema: schema,
        $_schemaNoExtraKeys: schemaNoExtraKeys,
        $_schemaExtraKeys: schemaExtraKeys,
        default: schema.default,
        $_compiledSchema: TypeCompiler.Compile(schema),
        $_compiledSchemaNoExtraKeys: TypeCompiler.Compile(schemaNoExtraKeys),
        $_compiledSchemaExtraKeys: TypeCompiler.Compile(schemaExtraKeys),
    };

    Object.defineProperties(shape, {
        runtimeType: {
            configurable: false,
            enumerable: false,
            get(): ShapeInitType<Init> {
                throw new Error('runtimeType cannot be used as a value, it is only for types.');
            },
        },
        [shapeIdentifier]: {
            configurable: false,
            enumerable: false,
            writable: false,
            value: true,
        },
    });

    return shape as Shape<Init>;
}

/**
 * Checks if `input` is a Shape.
 *
 * @category Internal
 */
export function isShape(input: unknown): input is Shape {
    return check.hasKey(input, shapeIdentifier) && !!input[shapeIdentifier];
}

/**
 * Checks if `input` is a TSchema.
 *
 * @category Internal
 */
export function isSchema(input: unknown): input is TSchema {
    return check.hasKey(input, Kind);
}

/**
 * Creates a copy of the given schema and applies `additionalProperties: false` to all object
 * schemas contained within.
 *
 * @category Internal
 */
function forceAdditionalProperties<T extends TSchema>(current: T, forcedValue: boolean): T {
    const clone: AnyObject = {
        ...current,
    };

    if (Array.isArray(current.anyOf)) {
        clone.anyOf = current.anyOf.map((entry) => forceAdditionalProperties(entry, forcedValue));
    }
    if (Array.isArray(current.allOf)) {
        clone.allOf = current.allOf.map((entry) => forceAdditionalProperties(entry, forcedValue));
    }

    if (isSchema(current.items)) {
        clone.items = forceAdditionalProperties(current.items, forcedValue);
    } else if (Array.isArray(current.items)) {
        clone.items = current.items.map((entry) => forceAdditionalProperties(entry, forcedValue));
    }

    if (check.isObject(current.properties)) {
        const newProps: AnyObject = {};
        Object.entries(current.properties as TObject['properties']).forEach(
            ([
                key,
                value,
            ]) => {
                newProps[key] = forceAdditionalProperties(value, forcedValue);
            },
        );
        clone.properties = newProps;
    }

    clone.additionalProperties = forcedValue;

    return clone;
}

/**
 * Converts the shape init to a TSchema.
 *
 * @category Internal
 */
export function shapeInitToSchema(init: unknown): TSchema {
    if (isSchema(init)) {
        return init;
    } else if (isShape(init)) {
        return init.$_schema;
    } else if (check.isFunction(init)) {
        return Type.Function([], Type.Any(), {
            default: init,
        });
    } else if (check.isObject(init)) {
        const objectDefault: AnyObject = {};
        const objectType: TProperties = {};

        Object.entries(init).forEach(
            ([
                key,
                value,
            ]) => {
                const valueSchema = shapeInitToSchema(value);
                objectType[key] = valueSchema;
                objectDefault[key] = valueSchema.default;
            },
        );

        return Type.Object(objectType, {
            default: objectDefault,
        });
    } else if (check.isArray(init)) {
        return Type.Array(Type.Union(init.map((entry) => shapeInitToSchema(entry))), {
            default: [],
        });
    } else if (check.isPrimitive(init)) {
        if (check.isString(init)) {
            return Type.String({
                default: init,
            });
        } else if (check.isNumber(init)) {
            return Type.Number({
                default: init,
            });
        } else if (check.isBoolean(init)) {
            return Type.Boolean({
                default: init,
            });
        } else if (check.isSymbol(init)) {
            return Type.Symbol({
                default: init,
            });
        } else if (check.isNull(init)) {
            return Type.Null({
                default: null,
            });
        } else if (check.isUndefined(init)) {
            return Type.Undefined({
                default: undefined,
            });
        } else if (check.isBigInt(init)) {
            return Type.BigInt({
                default: init,
            });
            /* node:coverage ignore next 7 */
        } else {
            assert.tsType(init).equals<never>();
            assert.never(`Unexpected primitive shape value type: '${typeof init}'`);
        }
    } else {
        throw new Error(`Invalid shape: ${stringify(init)}`);
    }
}

/**
 * Converts a shape init into its runtime type.
 *
 * @category Internal
 */
export type ShapeInitType<Init> =
    IsAny<Init> extends true
        ? any
        : IsUnknown<Init> extends true
          ? any
          : Init extends Shape
            ? Init['runtimeType']
            : Static<ShapeInitSchema<Init>>;
/**
 * Converts a shape init into its default value type.
 *
 * @category Internal
 */
export type ShapeInitDefault<Init> =
    IsAny<Init> extends true
        ? any
        : IsUnknown<Init> extends true
          ? any
          : Readonly<Static<ShapeInitSchema<Init>>>;

/**
 * Converts a shape init into its schema type.
 *
 * @category Internal
 */
export type ShapeInitSchema<Init> =
    IsAny<Init> extends true
        ? any
        : IsUnknown<Init> extends true
          ? any
          : Init extends TSchema
            ? Init
            : Init extends {$_schema: infer InnerSchema extends TSchema}
              ? InnerSchema
              : Init extends AnyFunction
                ? TUnsafe<Init>
                : Init extends string
                  ? TString
                  : Init extends number
                    ? TNumber
                    : Init extends boolean
                      ? TBoolean
                      : Init extends symbol
                        ? TSymbol
                        : Init extends null
                          ? TNull
                          : Init extends undefined
                            ? TUndefined
                            : Init extends bigint
                              ? TBigInt
                              : Init extends ReadonlyArray<infer InnerShape>
                                ? TArray<ShapeInitSchema<InnerShape>>
                                : Init extends AnyObject
                                  ? TObject<{[Key in keyof Init]: ShapeInitSchema<Init[Key]>}>
                                  : never;

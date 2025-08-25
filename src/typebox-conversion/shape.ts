import {assert, check, type Primitive} from '@augment-vir/assert';
import {stringify, type AnyObject} from '@augment-vir/common';
import {
    Kind,
    Type,
    type Static,
    type TArray,
    type TObject,
    type TProperties,
    type TSchema,
    type TUnsafe,
} from '@sinclair/typebox';
import {TypeCompiler, type TypeCheck} from '@sinclair/typebox/compiler';
import {type IsAny} from 'type-fest';

export type Shape<Init = any> = {
    default: ShapeInitDefault<Init>;
    $_schema: ShapeInitSchema<Init>;
    $_compiledSchema: TypeCheck<any>;
    runtimeType: ShapeInitType<Init>;
};

/**
 * A special key string which is used to tag {@link Shape} instances so that we know they're shapes
 * instead of part of the shape itself.
 *
 * We don't use `instanceof` with a Class constructor for this because that breaks when you have
 * multiple versions of object-shape-tester defining and consuming shapes.
 */
export const shapeIdentifier = Symbol.for('object-shape-tester.shape-identifier');

export function defineShape<Init = any>(init: Init): Shape<Init> {
    if (isShape(init)) {
        /**
         * If `init` is already a {@link Shape}, don't construct a new {@link Shape} instance, just
         * return the original one.
         */
        return init;
    }

    const schema = shapeInitToSchema(init) as ShapeInitSchema<Init>;

    const shape: Omit<Shape<Init>, 'runtimeType' | typeof shapeIdentifier> = {
        $_schema: schema,
        default: schema.default,
        $_compiledSchema: TypeCompiler.Compile(schema as any),
    };

    Object.defineProperties(shape, {
        runtimeType: {
            configurable: false,
            enumerable: false,
            get(): ShapeInitType<Init> {
                throw new Error(`runtimeType cannot be used as a value, it is only for types.`);
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

export function isShape(input: unknown): input is Shape {
    return check.hasKey(input, shapeIdentifier) && !!input[shapeIdentifier];
}

export function isSchema(input: unknown): input is TSchema {
    return check.hasKey(input, Kind);
}

export function shapeInitToSchema(init: unknown): TSchema {
    if (isSchema(init)) {
        return init;
    } else if (isShape(init)) {
        return init.$_schema;
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
            return Type.String({default: init});
        } else if (check.isNumber(init)) {
            return Type.Number({default: init});
        } else if (check.isBoolean(init)) {
            return Type.Boolean({default: init});
        } else if (check.isSymbol(init)) {
            return Type.Symbol({default: init});
        } else if (check.isNull(init)) {
            return Type.Null({default: null});
        } else if (check.isUndefined(init)) {
            return Type.Undefined({default: undefined});
        } else if (check.isBigInt(init)) {
            return Type.BigInt({default: init});
        } else {
            assert.tsType(init).equals<never>();
            assert.never(`Unexpected primitive shape value type: '${typeof init}'`);
        }
    } else {
        assert.never(`Unexpected shape value type: ${stringify(init)}`);
    }
}

export type ShapeInitType<Init> = IsAny<Init> extends true ? any : Static<ShapeInitSchema<Init>>;
export type ShapeInitDefault<Init> =
    IsAny<Init> extends true ? any : Readonly<Static<ShapeInitSchema<Init>>>;

export type ShapeInitSchema<Init> =
    IsAny<Init> extends true
        ? any
        : Init extends TSchema
          ? Init
          : Init extends {$_schema: infer InnerSchema extends TSchema}
            ? InnerSchema
            : Init extends Primitive
              ? TUnsafe<Init>
              : Init extends ReadonlyArray<infer InnerShape>
                ? TArray<ShapeInitSchema<InnerShape>>
                : Init extends AnyObject
                  ? TObject<{[Key in keyof Init]: ShapeInitSchema<Init[Key]>}>
                  : never;

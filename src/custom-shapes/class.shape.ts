import {combineErrorMessages, extractErrorMessage, log} from '@augment-vir/common';
import {Kind, type SchemaOptions, type TKind, Type, TypeRegistry} from '@sinclair/typebox';
import {defineShape} from '../shape/shape.js';

/**
 * Helper type for {@link classShape}.
 *
 * @category Internal
 */
export type AnyConstructor = new (...args: any[]) => any;

type ClassShapeSchemaOptions = {
    classConstructor: AnyConstructor;
} & TKind &
    SchemaOptions;

/**
 * Creates a shape for a specific class. Value checks are done through `instanceof`.
 *
 * @category Shape
 * @example
 *
 * ```ts
 * import {classShape, checkValidShape} from 'object-shape-tester';
 *
 * const myShape = classShape(RegExp);
 *
 * checkValidShape(/hi/, myShape); // `true`
 * checkValidShape('hi', myShape); // `false`
 * ```
 */
export function classShape<T extends AnyConstructor>(
    classConstructor: T,
    defaultValue?: InstanceType<T> | undefined,
) {
    if (!TypeRegistry.Has(classShape.name)) {
        TypeRegistry.Set(
            classShape.name,
            (schema: ClassShapeSchemaOptions, value) => value instanceof schema.classConstructor,
        );
    }

    return defineShape(
        Type.Unsafe<InstanceType<T>>({
            [Kind]: classShape.name,
            classConstructor,
            default: defaultValue ?? createClassDefaultValue(classConstructor),
        } satisfies ClassShapeSchemaOptions),
    );
}

function createClassDefaultValue(classConstructor: AnyConstructor) {
    try {
        return new classConstructor();
    } catch (caught) {
        log.error(
            combineErrorMessages(
                `Failed to create classShape default value for class '${classConstructor.name}':`,
                extractErrorMessage(caught),
            ),
        );

        return {};
    }
}

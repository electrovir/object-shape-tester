import {extractErrorMessage} from '@augment-vir/common';
import {Kind, type SchemaOptions, type TKind, Type, TypeRegistry} from '@sinclair/typebox';
import {ShapeClass} from '../../define-shape/shape-specifiers.js';
import {DefaultValueConstructionError} from '../../errors/default-value-construction.error.js';
import {defineShape} from '../shape.js';

/**
 * Helper type for {@link ShapeClass}.
 *
 * @category Internal
 */
export type AnyConstructor = new (...args: any[]) => any;

type ClassShapeSchemaOptions = {
    classConstructor: AnyConstructor;
} & TKind &
    SchemaOptions;

export function classShape<T extends AnyConstructor>(classConstructor: T) {
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
            get default() {
                try {
                    return new classConstructor();
                } catch (caught) {
                    throw new DefaultValueConstructionError(
                        `Failed to create default value for classShape for class '${classConstructor.name}': ${extractErrorMessage(caught)}`,
                    );
                }
            },
        } satisfies ClassShapeSchemaOptions),
    );
}

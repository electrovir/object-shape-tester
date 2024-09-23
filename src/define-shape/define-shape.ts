import {ShapeDefinition, ShapeToRuntimeType, isShapeDefinitionKey} from './shape-specifiers.js';
import {shapeToDefaultValue} from './shape-to-default-value.js';

export function defineShape<Shape, IsReadonly extends boolean = false>(
    shape: Shape,
    isReadonly: IsReadonly = false as IsReadonly,
): ShapeDefinition<Shape, IsReadonly> {
    return {
        shape,
        get runtimeType(): ShapeToRuntimeType<Shape, false, IsReadonly> {
            throw new Error(`runtimeType cannot be used as a value, it is only for types.`);
        },
        isReadonly,
        get defaultValue() {
            return shapeToDefaultValue(shape);
        },
        [isShapeDefinitionKey]: true,
    };
}

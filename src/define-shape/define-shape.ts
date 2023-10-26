import {ShapeDefinition, ShapeToRunTimeType, isShapeDefinitionKey} from './shape-specifiers';
import {shapeToDefaultValue} from './shape-to-default-value';

export function defineShape<Shape, IsReadonly extends boolean = false>(
    shape: Shape,
    isReadonly: IsReadonly = false as IsReadonly,
): ShapeDefinition<Shape, IsReadonly> {
    return {
        shape,
        get runTimeType(): ShapeToRunTimeType<Shape, false, IsReadonly> {
            throw new Error(`runTimeType cannot be used as a value, it is only for types.`);
        },
        isReadonly,
        defaultValue: shapeToDefaultValue(shape),
        [isShapeDefinitionKey]: true,
    };
}

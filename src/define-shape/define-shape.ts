import {ShapeDefinition, ShapeToRunTimeType, shapeSymbol} from './shape-specifiers';
import {shapeToDefaultValue} from './shape-to-default-value';

export function defineShape<Shape>(shape: Shape): ShapeDefinition<Shape> {
    return {
        shape,
        get runTimeType(): ShapeToRunTimeType<Shape> {
            throw new Error(`runTimeType cannot be used as a value, it is only for types.`);
        },
        defaultValue: shapeToDefaultValue(shape),
        [shapeSymbol]: true,
    };
}

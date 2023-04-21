import {ShapeToRunTimeType} from './shape-specifiers';

export type ShapeDefinition<Shape> = {
    shape: Shape;
    runTimeType: ShapeToRunTimeType<Shape>;
};

export function defineShape<Shape>(shape: Shape): ShapeDefinition<Shape> {
    return {
        shape,
        get runTimeType(): ShapeToRunTimeType<Shape> {
            throw new Error(`runTimeType cannot be used as a value, it is only for types.`);
        },
    };
}

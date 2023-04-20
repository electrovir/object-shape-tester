import {SpecifierToRunTimeType} from './shape-specifiers';

export type ShapeDefinition<Shape> = {
    shape: Shape;
    runTimeType: SpecifierToRunTimeType<Shape>;
};

export function defineShape<Shape>(shape: Shape): ShapeDefinition<Shape> {
    return {
        shape,
        get runTimeType(): SpecifierToRunTimeType<Shape> {
            throw new Error(`runTimeType cannot be used as a value, it is only for types.`);
        },
    };
}

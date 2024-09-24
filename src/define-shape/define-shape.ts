import {ShapeDefinition, ShapeToRuntimeType, isShapeDefinitionKey} from './shape-specifiers.js';
import {shapeToDefaultValue} from './shape-to-default-value.js';

/**
 * Creates a {@link ShapeDefinition} from any input. This produces both a type and a default value.
 * This is the core of the `object-shape-tester` package; {@link ShapeDefinition} instances are used
 * for all of the shape checking.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {defineShape} from 'object-shape-tester';
 *
 * const myShape = defineShape({
 *     a: '',
 *     b: -1,
 * });
 *
 * function doThing(
 *     // using the generated type and default value
 *     input: typeof myShape.runtimeType = myShape.defaultValue,
 * ) {}
 * ```
 */
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

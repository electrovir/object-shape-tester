import {type Primitive} from '@augment-vir/assert';
import {Symbol} from '@sinclair/typebox';
import {type Shape} from '../shape/shape.js';
import {unionShape} from './union.shape.js';

/**
 * Creates a shape that only allows primitive values.
 *
 * @category Shape
 */
export function primitiveShape(defaultValue?: Primitive): Shape<Primitive> {
    return unionShape(
        defaultValue,
        '',
        -1,
        0n,
        false,
        Symbol(),
        null,
        undefined,
    ) as Shape as Shape<Primitive>;
}

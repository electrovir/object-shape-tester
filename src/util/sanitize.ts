import {check} from '@augment-vir/assert';
import {type TSchema} from '@sinclair/typebox';
import {Clean} from '@sinclair/typebox/value';
import {ensureShape, type RuntimeTypeOf} from '../shape/check-shape.js';
import {type Shape} from '../shape/shape.js';

/**
 * Removes properties that are not defined by the given shape, including within nested objects.
 *
 * This mutates object inputs. Values that are not objects are returned unchanged.
 *
 * @category Util
 */
export function sanitizeValueByShape<const SpecificShape extends Shape | TSchema>(
    shape: SpecificShape,
    value: NoInfer<RuntimeTypeOf<SpecificShape>>,
): NoInfer<RuntimeTypeOf<SpecificShape>> {
    if (!check.isObject(value)) {
        return value;
    }

    return Clean(ensureShape(shape).$_schema, value);
}

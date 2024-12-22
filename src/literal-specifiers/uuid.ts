import {check} from '@augment-vir/assert';
import {literal} from '../define-shape/literal-specifier.js';

/**
 * A shape that only matches UUID string literals.
 *
 * @category Shape Part
 */
export const uuidShape = literal('00000000-0000-0000-0000-000000000000', check.isUuid);

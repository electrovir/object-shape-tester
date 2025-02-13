import {assertWrap, check} from '@augment-vir/assert';
import {customShape} from '../define-shape/custom-specifier.js';

/**
 * A shape that only matches UUID strings. Does not match nil or max UUID strings. The default value
 * is a v4 UUID.
 *
 * @category Shape Part
 */
export const uuidShape = customShape({
    customName: 'UUID',
    defaultValue: assertWrap.isUuid('00000000-0000-1000-0000-000000000000'),
    checker: check.isUuid,
});

/**
 * A shape that only matches non-empty strings.
 *
 * @category Shape Part
 */
export const nonEmptyStringShape = customShape({
    customName: 'Non-empty String',
    defaultValue: ' ',
    checker: (value) => !!value,
});

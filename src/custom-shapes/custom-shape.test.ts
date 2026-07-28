import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {getNowInIsoString, isValidIsoString, type UtcIsoString} from 'date-vir';
import {assertValidShape, checkValidShape} from '../shape/check-shape.js';
import {createCustomShape} from './custom-shape.js';

describe(createCustomShape.name, () => {
    it('creates a custom shape', () => {
        const utcIsoStringShape = createCustomShape({
            default: getNowInIsoString(),
            name: 'TEST_TEST_UtcIsoString',
            checkValue(value) {
                return isValidIsoString(value);
            },
        });

        assert.throws(() => assertValidShape('', utcIsoStringShape()), {
            matchMessage: "Expected kind 'TEST_TEST_UtcIsoString'",
        });
        // eslint-disable-next-line @virmator/no-raw-date
        assertValidShape(new Date().toISOString(), utcIsoStringShape());
        assertValidShape(utcIsoStringShape().default, utcIsoStringShape());

        const value: string = getNowInIsoString();

        if (checkValidShape(value, utcIsoStringShape())) {
            assert.tsType(value).equals<UtcIsoString>();
        } else {
            assert.tsType(value).equals<string>();
            assert.never();
        }
    });
});

import {assert} from '@augment-vir/assert';
import {measureExecutionDuration} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {assertValidShape} from '../verify-shape/verify-shape.js';
import {mockBigObject} from './big-object.mock.js';
import {mockBigShape} from './big-shape.mock.js';

describe('verify shape performance', () => {
    it('should be very fast', () => {
        const duration = measureExecutionDuration(() => {
            assertValidShape(mockBigObject, mockBigShape);
        });

        /**
         * These should take around 20-50 milliseconds but we give it some headroom here for GitHub
         * Actions, which are very slow.
         */
        assert.isBelow(duration.milliseconds, 500);
    });
});

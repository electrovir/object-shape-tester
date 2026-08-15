import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {defineShape} from '../shape/shape.js';
import {sanitizeValueByShape} from './sanitize.js';

describe(sanitizeValueByShape.name, () => {
    it('removes extra properties recursively', () => {
        const shape = defineShape({
            id: '',
            preferences: {
                color: '',
                notifications: [
                    {
                        email: true,
                    },
                ],
            },
        });
        const value = {
            id: 'user-123',
            untrusted: 'remove this',
            preferences: {
                color: 'blue',
                untrusted: 'remove this too',
                notifications: [
                    {
                        email: true,
                        untrusted: 'remove this as well',
                    },
                ],
            },
        };

        const sanitizedValue = sanitizeValueByShape(shape, value);

        assert.tsType(sanitizedValue).equals<{
            id: string;
            preferences: {
                color: string;
                notifications: {
                    email: boolean;
                }[];
            };
        }>();
        assert.deepEquals(sanitizedValue, {
            id: 'user-123',
            preferences: {
                color: 'blue',
                notifications: [
                    {
                        email: true,
                    },
                ],
            },
        });
        assert.isTrue(sanitizedValue === value);
    });

    it('returns non-object values directly', () => {
        const value = 'unchanged';

        assert.strictEquals(sanitizeValueByShape(defineShape(''), value), value);
    });
});

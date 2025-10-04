import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {assertValidShape} from '../shape/check-shape.js';
import {defineShape} from '../shape/shape.js';
import {pickShape} from './pick.shape.js';

describe(pickShape.name, () => {
    it('produces picked type', () => {
        const pickedShape = pickShape(
            defineShape({
                hello: '',
                goodbye: '',
                when: -1,
            }),
            [
                'goodbye',
                'when',
            ],
        );

        assert.tsType<typeof pickedShape.runtimeType>().equals<{
            goodbye: string;
            when: number;
        }>();

        assertValidShape(
            {
                goodbye: 'hi',
                when: 10,
            },
            pickedShape,
        );
    });
    it('errors on invalid key pick', () => {
        const pickedShape = pickShape(
            defineShape({
                hello: '',
                goodbye: '',
                when: -1,
            }),
            [
                'goodbye',
                'when',
                // @ts-expect-error: intentionally incorrect key
                'not a key',
            ],
        );
    });
});

import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {assertValidShape, checkValidShape} from '../shape/check-shape.js';
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
            {
                goodbye: true,
                when: true,
            },
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
        assert.isFalse(
            checkValidShape(
                {
                    goodbye: 'hi',
                    when: 10,
                    hello: 'another value',
                },
                pickedShape,
                {
                    preventExtraKeys: true,
                },
            ),
        );
        assertValidShape(
            {
                goodbye: 'hi',
                when: 10,
                hello: 'another value',
            },
            pickedShape,
            {
                allowExtraKeys: true,
            },
        );
    });
    it('works with a plain object input', () => {
        const pickedShape = pickShape(
            {
                hello: '',
                goodbye: '',
                when: -1,
            },
            {
                goodbye: true,
                when: true,
            },
        );

        assert.tsType<typeof pickedShape.runtimeType>().equals<
            Readonly<{
                goodbye: string;
                when: number;
            }>
        >();

        assertValidShape(
            {
                goodbye: 'hi',
                when: 10,
            },
            pickedShape,
        );
        assert.isFalse(
            checkValidShape(
                {
                    goodbye: 'hi',
                    when: 10,
                    hello: 'another value',
                },
                pickedShape,
                {
                    preventExtraKeys: true,
                },
            ),
        );
        assertValidShape(
            {
                goodbye: 'hi',
                when: 10,
                hello: 'another value',
            },
            pickedShape,
            {
                allowExtraKeys: true,
            },
        );
    });
    it('errors on invalid key pick', () => {
        const pickedShape = pickShape(
            defineShape({
                hello: '',
                goodbye: '',
                when: -1,
            }),
            {
                goodbye: true,
                when: true,
                // @ts-expect-error: intentionally incorrect key
                'not a key': true,
            },
        );

        assert.tsType<typeof pickedShape.runtimeType>().equals<{
            goodbye: string;
            when: number;
        }>();
    });
    it('does not allow nested selection', () => {
        const pickedShape = pickShape(
            defineShape({
                hello: '',
                goodbye: '',
                when: -1,
            }),
            {
                goodbye: true,
                when: true,
            },
        );

        assert.tsType<typeof pickedShape.runtimeType>().equals<{
            goodbye: string;
            when: number;
        }>();
    });
});

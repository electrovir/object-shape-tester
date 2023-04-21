import {assertTypeOf} from '@augment-vir/browser-testing';
import {assert} from '@open-wc/testing';
import {ExtractInstanceTypes, isShapeSpecifier} from '../define-shape-specifier';
import {TupleCombiner, tuple} from './tuple';

describe(tuple.name, () => {
    it('produces correct types', () => {
        const tupleInstance = tuple([
            'hello',
            'there',
            0,
        ]);
        assertTypeOf<ExtractInstanceTypes<typeof tupleInstance>>().toEqualTypeOf<
            [['hello', 'there', 0]]
        >();
        const tupleType: TupleCombiner<typeof tupleInstance> = [
            4,
            4,
            4,
        ];
        assertTypeOf<TupleCombiner<typeof tupleInstance>>().toEqualTypeOf<
            [string, string, number]
        >();

        assert.isTrue(isShapeSpecifier(tupleInstance));
    });

    it('allows only one input', () => {
        // @ts-expect-error
        tuple();
        // @ts-expect-error
        tuple('', 5, {});
        // works
        tuple('');
    });
});

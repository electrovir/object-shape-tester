import {assertTypeOf} from '@augment-vir/browser-testing';
import {assert} from '@open-wc/testing';
import {ExtractInstanceTypes, isShapeSpecifier} from '../define-shape-specifier';
import {ExactCombiner, exact} from './exact';

describe(exact.name, () => {
    it('produces correct types', () => {
        const exactInstance = exact('hello');
        assertTypeOf<ExtractInstanceTypes<typeof exactInstance>>().toEqualTypeOf<['hello']>();
        assertTypeOf<ExactCombiner<typeof exactInstance>>().toEqualTypeOf<'hello'>();

        assert.isTrue(isShapeSpecifier(exactInstance));
    });

    it('allows only one input', () => {
        // @ts-expect-error
        exact();
        // @ts-expect-error
        exact('', 5, {});
        // works
        exact('');
    });
});

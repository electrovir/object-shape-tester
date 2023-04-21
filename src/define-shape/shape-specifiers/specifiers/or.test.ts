import {assertTypeOf} from '@augment-vir/browser-testing';
import {assert} from '@open-wc/testing';
import {ExtractInstanceTypes, isShapeSpecifier} from '../define-shape-specifier';
import {OrCombiner, or} from './or';

describe(or.name, () => {
    it('produces correct types', () => {
        const orInstance = or('', 0);
        assertTypeOf<ExtractInstanceTypes<typeof orInstance>>().toEqualTypeOf<['', 0]>();
        assertTypeOf<OrCombiner<typeof orInstance>>().toEqualTypeOf<string | number>();

        assert.isTrue(isShapeSpecifier(orInstance));
    });

    it('requires at least one input', () => {
        // @ts-expect-error
        or();
        // works
        or('');
        // still works
        or('', 5, {});
    });
});

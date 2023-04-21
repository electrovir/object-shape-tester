import {assertTypeOf} from '@augment-vir/browser-testing';
import {assert} from '@open-wc/testing';
import {ExtractInstanceTypes, isShapeSpecifier} from '../define-shape-specifier';
import {AndCombiner, and} from './and';

describe(and.name, () => {
    it('produces correct types', () => {
        const andInstance = and('', 0);
        assertTypeOf<ExtractInstanceTypes<typeof andInstance>>().toEqualTypeOf<['', 0]>();
        assertTypeOf<AndCombiner<typeof andInstance>>().toEqualTypeOf<string & number>();

        assert.isTrue(isShapeSpecifier(andInstance));
    });

    it('requires at least one input', () => {
        // @ts-expect-error
        and();
        // works
        and('');
        // still works
        and('', 5, {});
    });
});

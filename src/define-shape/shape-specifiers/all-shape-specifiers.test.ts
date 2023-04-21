import {assertTypeOf} from '@augment-vir/browser-testing';
import {allSpecifiers} from './all-shape-specifiers';
import {and} from './specifiers/and';
import {or} from './specifiers/or';
describe('allSpecifiers', () => {
    it('maintains proper types for or', () => {
        function doNotActuallyRunThis() {
            const orInstance = or('', 5);
            const combinerOutput = allSpecifiers[or.markerSymbol].combiner(orInstance);

            assertTypeOf(combinerOutput).toEqualTypeOf<number | string>();
        }
    });
    it('maintains proper types for and', () => {
        function doNotActuallyRunThis() {
            const andInstance = and('', 5);
            const combinerOutput = allSpecifiers[and.markerSymbol].combiner(andInstance);

            assertTypeOf(combinerOutput).toEqualTypeOf<number & string>();
        }
    });
});

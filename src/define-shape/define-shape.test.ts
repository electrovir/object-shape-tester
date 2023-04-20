import {assertTypeOf} from '@augment-vir/browser-testing';
import {defineShape} from './define-shape';

describe(defineShape.name, () => {
    it('creates a simple shape object with correct type', () => {
        const shapeDefinition = defineShape({
            helloThere: 'hi',
        });

        assertTypeOf<(typeof shapeDefinition)['runTimeType']>().toEqualTypeOf<{
            helloThere: string;
        }>();
        assertTypeOf(shapeDefinition.shape).toEqualTypeOf({helloThere: 'hi'});
        assertTypeOf(shapeDefinition.shape).toEqualTypeOf<{helloThere: string}>();
    });

    it('converts shape specifiers', () => {
        const shapeDefinition = defineShape({
            helloThere: 'hi',
        });

        assertTypeOf<(typeof shapeDefinition)['runTimeType']>().toEqualTypeOf<{
            helloThere: string;
        }>();
        assertTypeOf(shapeDefinition.shape).toEqualTypeOf({helloThere: 'hi'});
        assertTypeOf(shapeDefinition.shape).toEqualTypeOf<{helloThere: string}>();
    });
});

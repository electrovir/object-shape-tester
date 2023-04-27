import {assertTypeOf} from '@augment-vir/browser-testing';
import {assert} from '@open-wc/testing';
import {defineShape} from './define-shape';
import {exact, unknownShape} from './shape-specifiers';

describe(defineShape.name, () => {
    const exampleShape = defineShape({
        helloThere: 'hi',
    });

    type MyShape = typeof exampleShape.runTimeType;

    it('creates a simple shape object with correct type', () => {
        assertTypeOf<(typeof exampleShape)['runTimeType']>().toEqualTypeOf<{
            helloThere: string;
        }>();
        assertTypeOf(exampleShape.shape).toEqualTypeOf({helloThere: 'hi'});
        assertTypeOf(exampleShape.shape).toEqualTypeOf<{helloThere: string}>();
    });

    it('converts shape specifiers', () => {
        assertTypeOf<(typeof exampleShape)['runTimeType']>().toEqualTypeOf<{
            helloThere: string;
        }>();
        assertTypeOf(exampleShape.shape).toEqualTypeOf({helloThere: 'hi'});
        assertTypeOf(exampleShape.shape).toEqualTypeOf<{helloThere: string}>();
    });

    it('throws an error if runtimeType is accessed as a value', () => {
        assert.throws(() => {
            exampleShape.runTimeType;
        });
    });

    it('produces run time types from the shape definition', () => {
        const myShapeAssignment: MyShape = {
            helloThere: '',
        };

        const shapeWithExact = defineShape({exactProp: exact('derp')});
        type MyExact = typeof shapeWithExact.runTimeType;
        const myExactAssignment: MyExact = {
            exactProp: 'derp',
        };
        const myBadExactAssignment: MyExact = {
            // @ts-expect-error
            exactProp: 'four',
        };
    });

    it('works with bare specifiers', () => {
        const myShape = defineShape(unknownShape());
        const myInstance: (typeof myShape)['runTimeType'] = myShape.defaultValue;

        const myNestedShape = defineShape({
            nested: myShape,
        });
        const myNestedInstance: (typeof myNestedShape)['runTimeType'] = myNestedShape.defaultValue;
    });
});

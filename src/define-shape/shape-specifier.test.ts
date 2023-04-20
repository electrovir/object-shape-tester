import {assertTypeOf} from '@augment-vir/browser-testing';
import {ShapeAnd, ShapeExact, ShapeOr, ShapeToRunTimeType} from './shape-specifiers';

describe('ShapeToRunTimeType', () => {
    it('converts specifiers into their part types', () => {
        assertTypeOf<
            ShapeToRunTimeType<{
                stringProp: 'hello';
                nestedObjectProp: {
                    nestedString: string;
                    nestedMaybeNumber: number | undefined;
                    myNestedAnd: ShapeAnd<string | number>;
                };
                myOr: ShapeOr<string | number>;
                myAnd: ShapeAnd<string | number>;

                myObjectOr: ShapeOr<
                    | {
                          hello: 'there';
                          why: ShapeExact<'are we here' | 'are you there'>;
                      }
                    | number
                >;
                myExactObject: ShapeExact<{
                    nestedExact: 'hello';
                    moreNestedExact: 'why';
                }>;
                myExact: ShapeExact<'hello there'>;
            }>
        >().toEqualTypeOf<{
            stringProp: string;
            nestedObjectProp: {
                nestedString: string;
                nestedMaybeNumber: number | undefined;
                myNestedAnd: string & number;
            };
            myOr: string | number;
            myAnd: string & number;
            myObjectOr:
                | {
                      hello: string;
                      why: 'are we here' | 'are you there';
                  }
                | number;
            myExactObject: {
                nestedExact: 'hello';
                moreNestedExact: 'why';
            };
            myExact: 'hello there';
        }>();
    });
});

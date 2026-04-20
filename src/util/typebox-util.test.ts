import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {Kind, Type, type TSchema, type TUnion} from '@sinclair/typebox';
import {insertUnion, isUnionSchema} from './typebox-util.js';

describe(insertUnion.name, () => {
    it('adds insertion to existing union and preserves default', () => {
        const numberSchema = Type.Number({
            default: 5,
        });
        const stringSchema = Type.String({
            default: 'hi',
        });
        const baseUnion = Type.Union(
            [
                numberSchema,
                stringSchema,
            ],
            {
                default: 5,
            },
        );
        const insertion = Type.Boolean({
            default: false,
        });

        const result = insertUnion({
            originalSchema: baseUnion,
            insertion,
        });

        assert.isTrue(isUnionSchema(result));
        assert.strictEquals(result.default, 5);
        assert.strictEquals(result.anyOf.length, 3);
        // original schemas preserved at start
        assert.strictEquals(result.anyOf[0], numberSchema);
        assert.strictEquals(result.anyOf[1], stringSchema);
        // insertion appended (guard for types)
        const appended = result.anyOf[2];
        assert.isDefined(appended);
        assert.strictEquals(appended[Kind], insertion[Kind]);
    });

    it('wraps non-union with undefined and ignores insertion', () => {
        const original = Type.String({
            default: 'value',
        });
        const insertion = Type.Number({
            default: 42,
        });

        const result = insertUnion({
            originalSchema: original,
            insertion,
        });
        assert.isTrue(isUnionSchema(result));
        assert.strictEquals(result.default, 'value');
        assert.strictEquals(result.anyOf.length, 2);
        // first is original
        assert.strictEquals(result.anyOf[0], original);
        // second is undefined (not the insertion number schema)
        const second = result.anyOf[1] as TSchema;
        assert.notStrictEquals(second, insertion);
        assert.strictEquals(second[Kind], 'Undefined');
        // ensure insertion did not appear anywhere
        assert.isFalse(result.anyOf.includes(insertion as unknown as TUnion));
    });
});

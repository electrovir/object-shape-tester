import {assert} from '@augment-vir/assert';
import {Kind, Type, TypeRegistry, type TSchema} from '@sinclair/typebox';
import {TypeCompiler} from '@sinclair/typebox/compiler';
import {Value} from '@sinclair/typebox/value';

const UuidRegExp = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const UuidRecordKind = 'UuidRecord' as const;

// Factory: carry the inner value schema so the registry can check it
export function UuidRecord<V extends TSchema>(valueSchema: V) {
    return Type.Unsafe<Record<string, unknown>>({
        [Kind]: UuidRecordKind,
        type: 'object',
        // stash the inner schema for the registry (non-standard JSON Schema)
        valueSchema,
    });
}

// Checker: validate object shape, keys, and each value against the inner schema
TypeRegistry.Set(UuidRecordKind, (schema, input) => {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        return false;
    }
    const valueSchema = (schema as any).valueSchema as TSchema;
    for (const [
        key,
        val,
    ] of Object.entries(input as Record<string, unknown>)) {
        if (!UuidRegExp.test(key)) {
            return false;
        }
        if (!Value.Check(valueSchema, val)) {
            return false;
        }
    }
    return true;
});

// Usage
const schema = UuidRecord(Type.Number());
const C = TypeCompiler.Compile(schema);

assert.isFalse(C.Check({x: 5}));
assert.isTrue(C.Check({'9aa8a673-8590-4db2-9830-01755844f7c1': 5}));
assert.isFalse(C.Check({'9aa8a673-8590-4db2-9830-01755844f7c1': 'nope'}));

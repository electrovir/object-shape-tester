import {assert} from '@augment-vir/assert';
import {
    FormatRegistry,
    Kind,
    Type,
    TypeRegistry,
    type Static,
    type TSchema,
} from '@sinclair/typebox';
import {TypeCompiler} from '@sinclair/typebox/compiler';
import {Value} from '@sinclair/typebox/value';

const Uuid = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function IsUuid(value: string): boolean {
    return Uuid.test(value);
}
FormatRegistry.Set('uuid', (value) => IsUuid(value));

const KeyedRecordKind = 'KeyedRecord' as const;
type KeyedRecordOptions = {
    [Kind]: typeof KeyedRecordKind;
    keySchema: TSchema;
    valueSchema: TSchema;
};

export function KeyedRecord<K extends TSchema, V extends TSchema>(keySchema: K, valueSchema: V) {
    return Type.Unsafe<Record<Extract<Static<K>, PropertyKey>, Static<V>>>({
        [Kind]: KeyedRecordKind,
        keySchema,
        valueSchema,
    } satisfies KeyedRecordOptions);
}

TypeRegistry.Set(KeyedRecordKind, (schema: KeyedRecordOptions, input) => {
    if (typeof input !== 'object' || !input || Array.isArray(input)) {
        return false;
    }

    return Object.entries(input).every(
        ([
            key,
            value,
        ]) => {
            return Value.Check(schema.keySchema, key) && Value.Check(schema.valueSchema, value);
        },
    );
});

// lightweight usage checks (avoid disallowed console methods in repo rules)
assert.isFalse(
    TypeCompiler.Compile(KeyedRecord(Type.String({format: 'uuid'}), Type.Number())).Check({x: 5}),
);
assert.isTrue(
    TypeCompiler.Compile(KeyedRecord(Type.String({format: 'uuid'}), Type.Number())).Check({
        '9aa8a673-8590-4db2-9830-01755844f7c1': 5,
    }),
);

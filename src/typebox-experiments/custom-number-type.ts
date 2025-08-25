import {assert} from '@augment-vir/assert';
import {Kind, Type, TypeRegistry} from '@sinclair/typebox';
import {TypeCompiler} from '@sinclair/typebox/compiler';

const EvenKind = 'Even' as const;

export const Even = Type.Unsafe<number>({
    [Kind]: EvenKind,
    type: 'number',
});

TypeRegistry.Set(EvenKind, (_schema, value) => typeof value === 'number' && value % 2 === 0);

// Usage
const C = TypeCompiler.Compile(Even);
assert.isTrue(C.Check(2));
assert.isFalse(C.Check(3));

import {assert} from '@augment-vir/assert';
import {type Uuid} from '@augment-vir/common';
import {FormatRegistry, type Static, Type} from '@sinclair/typebox';
import {TypeCompiler} from '@sinclair/typebox/compiler';

const UuidRegExp = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

/**
 * `[ajv-formats]` A Universally Unique Identifier as defined by [RFC
 * 4122](https://datatracker.ietf.org/doc/html/rfc4122).
 *
 * @example `9aa8a673-8590-4db2-9830-01755844f7c1`
 */
export function IsUuid(value: string): value is Uuid {
    return UuidRegExp.test(value);
}

FormatRegistry.Set('uuid', (value): value is Uuid => IsUuid(value));

// assert.isFalse(
//     TypeCompiler.Compile(Type.Object(Type.String())).Check({
//         x: 5,
//     }),
//     'Object type is not guarding',
// );

console.log(
    TypeCompiler.Compile(Type.Record(Type.String({format: 'uuid'}), Type.Number())).Check({
        x: 5,
    }),
);

const UuidType = Type.Unsafe<Uuid>(Type.String({format: 'uuid'}));

type blah = Static<typeof UuidType>;
assert.tsType<Static<typeof UuidType>>().equals<Uuid>();

const myType = Type.Number({
    default: -1,
});

console.log(myType);
console.log(myType.params);
console.log(myType.default);

/**
 * Links
 *
 * - https://github.com/sinclairzx81/typebox/blob/master/example/formats/email.ts
 * - https://github.com/sinclairzx81/typebox
 * - https://github.com/sinclairzx81/typebox/issues/879#issuecomment-2127501422
 * - https://github.com/sinclairzx81/typebox/issues/1043
 * - https://github.com/sinclairzx81/typebox/discussions/1288
 */

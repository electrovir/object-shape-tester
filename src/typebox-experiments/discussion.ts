/** From: https://github.com/sinclairzx81/typebox/discussions/1288 */

import {FormatRegistry, Type} from '@sinclair/typebox';
import {TypeCompiler} from '@sinclair/typebox/compiler';

const Uuid = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
function IsUuid(value: string): boolean {
    return Uuid.test(value);
}
FormatRegistry.Set('uuid', (value) => IsUuid(value));

console.log(
    TypeCompiler.Compile(Type.Record(Type.String({format: 'uuid'}), Type.Number())).Check({
        x: 5,
    }),
);

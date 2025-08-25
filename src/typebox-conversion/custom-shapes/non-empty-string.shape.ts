import {FormatRegistry, Type} from '@sinclair/typebox';
import {defineShape} from '../shape.js';

export function nonEmptyShape(defaultValue: string = ' ') {
    if (!FormatRegistry.Has('non-empty')) {
        FormatRegistry.Set('non-empty', (value) => !!value);
    }

    return defineShape(
        Type.Unsafe<string>(Type.String({format: 'non-empty', default: defaultValue})),
    );
}

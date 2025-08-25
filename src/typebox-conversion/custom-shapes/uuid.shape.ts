import {check} from '@augment-vir/assert';
import {type Uuid} from '@augment-vir/common';
import {FormatRegistry, Type} from '@sinclair/typebox';
import {defineShape} from '../shape.js';

export function uuidShape(defaultValue: Uuid = '00000000-0000-1000-0000-000000000000') {
    if (!FormatRegistry.Has('uuid')) {
        FormatRegistry.Set('uuid', (value) => check.isUuid(value));
    }

    return defineShape(Type.Unsafe<Uuid>(Type.String({format: 'uuid', default: defaultValue})));
}

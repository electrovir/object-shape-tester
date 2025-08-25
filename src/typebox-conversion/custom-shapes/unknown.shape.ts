import {Type} from '@sinclair/typebox';
import {defineShape} from '../shape.js';

export function unknownShape(defaultValue?: unknown) {
    return defineShape(Type.Unknown({default: defaultValue}));
}

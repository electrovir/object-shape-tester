import {Type} from '@sinclair/typebox';
import {defineShape} from '../shape.js';

export function optionalShape<T>(value: T) {
    return defineShape(Type.Optional(defineShape(value).$_schema));
}

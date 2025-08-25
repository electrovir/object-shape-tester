import {type TConst, Type} from '@sinclair/typebox';
import {defineShape, type Shape} from '../shape.js';

export function exactShape<const T>(value: T): Shape<TConst<T>> {
    return defineShape(Type.Const<T>(value, {default: value}));
}

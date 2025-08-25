import {type Static, type TSchema, } from '@sinclair/typebox';
import {TypeCompiler} from '@sinclair/typebox/compiler';
import {assertValidShape} from '../old/verify-shape.js';
import {mockBigObject} from './big-object.mock.js';
import {mockBigType} from './big-shape-typebox.mock.js';
import {mockBigShape} from './big-shape.mock.js';

function runValidation(verifyShape: (input: any) => void): number {
    const durations: number[] = [];

    for (let i = 0; i <= 1000; i++) {
        const start = Date.now();
        verifyShape(mockBigObject);
        durations.push(Date.now() - start);
    }

    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
}


class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

const validator = TypeCompiler.Compile(mockBigType);

function assertValid<T extends TSchema>(data: unknown): Static<T> {
    if (!validator.Check(mockBigType.Check(data)) {
        const errors = [...validator.Errors(data)];
        throw new ValidationError(
            JSON.stringify(errors.map(({path, message}) => ({path, message}))),
        );
    }
    return data as Static<T>;
}

console.log(
    '@sinclair/typebox:  ',
    runValidation((value) => {
        assertValid(value);
    }),
);


console.log(
    'object-shape-tester:',
    runValidation((value) => assertValidShape(value, mockBigShape)),
);
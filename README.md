# object-shape-tester

Create types, run-time type requirements, and run-time default values with a single definition.

Can be used in tests and at run-time (it does not depend on any testing libraries).

Full API docs: https://electrovir.github.io/object-shape-tester

# Installation

```sh
npm i object-shape-tester
```

# Usage

This package allows you to define an object's shape in a manner which can be used for testing objects at run time to make sure they conform to your defined shapes. Because it also generates TS types from your defined shape _and_ a default run-time value from your defined shape, **you will have one single source of truth** for all types, defaults, and shape tests.

## Simple example

See this simple example for defining a simple user type:

<!-- example-link: src/readme-examples/simple-user-shape.example.ts -->

```TypeScript
import {defineShape, isValidShape} from 'object-shape-tester';

const userShapeDefinition = defineShape({
    name: 'empty name',
    id: 0,
});

export type User = typeof userShapeDefinition.runTimeType;

export const emptyUser = userShapeDefinition.defaultValue;

export function isUser(input: unknown): input is User {
    // you don't NEED to wrap isValidShape in a type guard as it is already a type guard itself
    return isValidShape(input, userShapeDefinition);
}

const myUser: User = {
    name: 'my name',
    id: 1000,
};
```

From a single object (passed into `defineShape`), we get a type definition, a default value, and an object which can be used for run-time object shape testing.

## Complex example

For more complex types, this package provides type specifiers that you can use. The available type specifiers are currently the following:

-   `or(valueA, valueB, ...)`: for allowing multiple types. This gets converted in TypeScript to a union.
-   `and(valueA, valueB, ...)`: for creating a combined type. This gets converted in TypeScript to an intersection.
-   `exact(valueA, valueB, ...)`: requires the provided value to be exactly matched. This gets converted in TypeScript to a literal const type. (Example: instead of a value of `'empty name'` getting converted into a string type, `exact('empty name')` will _only_ allow the value `'empty name'`.)
-   `enumShape(enumA)`: use this for enum types.
-   `unknownShape()`: use this to allow any type.

Here's a more complex user example that uses all of the above specifiers:

<!-- example-link: src/readme-examples/complex-user-shape.example.ts -->

```TypeScript
import {and, defineShape, enumShape, exact, isValidShape, or, unknownShape} from 'object-shape-tester';

enum AuthLevel {
    Basic = 'basic',
    Admin = 'admin',
}

const complexUserShapeDefinition = defineShape({
    firstName: 'first',
    middleInitial: or('M', undefined),
    lastName: 'last',
    id: 0,
    tags: and({userTags: ['']}, {creatorTags: ['']}),
    primaryColor: exact('red', 'green', 'blue'),
    authLevel: enumShape(AuthLevel),
    extraDetails: unknownShape(),
});

export type ComplexUser = typeof complexUserShapeDefinition.runTimeType;

export const emptyComplexUser = complexUserShapeDefinition.defaultValue;

export function isComplexUser(input: unknown): input is ComplexUser {
    // you don't NEED to wrap isValidShape in a type guard as it is already a type guard itself
    return isValidShape(input, complexUserShapeDefinition);
}

const myComplexUser: ComplexUser = {
    firstName: 'my first',
    middleInitial: undefined,
    lastName: 'last name',
    id: 1000,
    tags: {
        userTags: [],
        creatorTags: [],
    },
    primaryColor: 'blue',
    authLevel: AuthLevel.Admin,
    extraDetails: {
        whatever: 'you want',
    },
};
```

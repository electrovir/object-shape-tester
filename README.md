# object-shape-tester

Create types, runtime type requirements, and runtime default values all at once.

Can be used in tests and at runtime (it does not depend on any testing libraries).

Full API docs: https://electrovir.github.io/object-shape-tester

## Installation

```sh
npm i object-shape-tester
```

## Simple example

See this simple example for defining a shape:

<!-- example-link: src/readme-examples/simple-user-shape.example.ts -->

```TypeScript
import {assertValidShape, defineShape} from 'object-shape-tester';

const userShape = defineShape({
    /**
     * This value is simplified to just a `string` required type, with `'empty name'` as the default
     * value.
     */
    name: 'empty name',
    /** This value is simplified to just a `number` required type, with `0` as the default value. */
    id: 0,
});

/** Access the TypeScript type with `.runtimeType`. */
export type User = typeof userShape.runtimeType;

/**
 * Access the default value with `.default`. For this shape, the default value is:
 *
 * `{name: 'empty name', id: 0}`
 */
export const emptyUser = userShape.default;

const myUser: User = {
    name: 'my name',
    id: 1000,
};

assertValidShape(myUser, userShape);
```

From a single object (passed into `defineShape`), we get a type definition, a default value, and an object which can be used for runtime object shape testing.

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
import {
    assertValidShape,
    defineShape,
    enumShape,
    exactShape,
    intersectShape,
    unionShape,
    unknownShape,
} from 'object-shape-tester';

enum AuthLevel {
    Basic = 'basic',
    Admin = 'admin',
}

const userShape = defineShape({
    firstName: 'first',
    middleInitial: unionShape('M', undefined),
    lastName: 'last',
    id: 0,
    tags: intersectShape(
        {
            userTags: [''],
        },
        {
            creatorTags: [''],
        },
    ),
    primaryColor: unionShape(exactShape('red'), exactShape('green'), exactShape('blue')),
    authLevel: enumShape(AuthLevel),
    extraDetails: unknownShape(),
});

export type ComplexUser = typeof userShape.runtimeType;

export const emptyComplexUser = userShape.default;

const myUser: ComplexUser = {
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

assertValidShape(myUser, userShape);
```

## Additional shapes

There are many built-in shapes documented under `Shapes`: https://electrovir.github.io/object-shape-tester.

You can also use any schema from the [@sinclair/typebox](https://www.npmjs.com/package/@sinclair/typebox) package as an input for `defineShape()`.

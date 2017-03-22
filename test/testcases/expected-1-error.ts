interface Foo {
    foo: string;
}

export const foo: Foo = {
    fooo: "foo" //// TS2322: Type '{ fooo: string; }' is not assignable to type 'Foo'
};

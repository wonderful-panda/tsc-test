interface Foo {
    foo: string;
}

export const foo: Foo = {
    fooo: "foo"     //// TS0001|TS0002
};

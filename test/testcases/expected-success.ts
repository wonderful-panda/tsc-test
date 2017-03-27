interface Foo {
    foo: string;
    bar: number;
};

export const foo: Foo = {
    foo: "foo",
    bar: 1
};

foo.foo = "bar";
foo.bar = 2;


interface Foo {
    foo: string;
    bar: number;
};

export const foo: Foo = {
    foo: "foo",
    bar: 1
};

foo.foo = 1;

foo.bar = "bar";

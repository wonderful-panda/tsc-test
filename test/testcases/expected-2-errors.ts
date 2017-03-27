interface Foo {
    foo: string;
    bar: number;
};

export const foo: Foo = {
    foo: "foo",
    bar: 1
};

foo.foo = 1;        //// TS2322: Type '1' is not assignable
foo.bar = "bar";    //// TS2322: /Type .* is not assignable/

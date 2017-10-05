interface Foo {
    foo: string;
    bar: number;
}

export const foo: Foo = {   //// TS2324
    foo: "foo",
    bar: 1
};

foo.foo = "bar";    //// TS2322: Type '"bar"' is not assignable
foo.bar = 2;        //// TS2322: /type '2' is not assignable/i

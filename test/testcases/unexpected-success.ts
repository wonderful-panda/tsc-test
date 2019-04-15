interface Foo {
    foo: string;
    bar: number;
}

export const foo: Foo = {   //// TS2324|TS9999
    foo: "foo",
    bar: 1
};

foo.foo = "bar";    //// TS9999 | TS2322: Type '"bar"' is not assignable
foo.bar = 2;        //// TS2322: /type '2' is not assignable/i

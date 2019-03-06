export = SesShim;

declare namespace SesShim {
    export function def<T>(o: T): Readonly<T>;
    export function confine(exprSrc: any, env: any): any;
}

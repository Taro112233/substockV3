// types/cookie.d.ts
declare module 'cookie' {
  export interface CookieParseOptions {
    decode?: (str: string) => string;
  }

  export interface CookieSerializeOptions {
    domain?: string;
    encode?: (str: string) => string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    priority?: 'low' | 'medium' | 'high';
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    secure?: boolean;
  }

  export function parse(
    str: string,
    options?: CookieParseOptions
  ): Record<string, string>;

  export function serialize(
    name: string,
    value: string,
    options?: CookieSerializeOptions
  ): string;
}
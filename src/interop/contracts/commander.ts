import type { Command, Option } from '@commander-js/extra-typings';

// The preserved runtime's extra-typings14 wrapper re-exports Commander15 values.
// These official15 declarations describe that actual constructor/option API;
// this development-only dependency is never substituted into the shipped bundle.
declare module '../modules.js' {
  interface ExternalModules {
    '../../node_modules/.pnpm/@commander-js+extra-typings@14.0.0_commander@15.0.0/node_modules/@commander-js/extra-typings/esm.mjs': {
      uB: typeof Command;
      c$: typeof Option;
    };
  }
}

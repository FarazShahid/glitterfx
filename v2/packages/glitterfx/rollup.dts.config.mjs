// Bundle the public type declarations into one self-contained .d.ts per entry point, inlining the
// private @glitterfx/* libraries (they are not published). three and react stay external.
import { dts } from 'rollup-plugin-dts';

const external = (id) => id === 'three' || id.startsWith('three/') || id === 'react' || id.startsWith('react/');

export default ['index', 'canvas', 'react', 'webgl'].map((name) => ({
  input: `build/types/${name}.d.ts`,
  output: { file: `dist/${name}.d.ts`, format: 'es' },
  external,
  plugins: [
    dts({
      respectExternal: true,
      // Resolve the private workspace libraries to their built declarations so they get inlined.
      compilerOptions: { baseUrl: '.', paths: { '@glitterfx/*': ['../*/dist/index.d.ts'] } },
    }),
  ],
}));

import { dts } from 'rollup-plugin-dts';

const external = (id) => id === 'three' || id.startsWith('three/') || id === 'react' || id.startsWith('react/');

export default ['index', 'canvas', 'react', 'webgl', 'legacy'].map((name) => ({
  input: `build/types/${name}.d.ts`,
  output: { file: `dist/${name}.d.ts`, format: 'es' },
  external,
  plugins: [
    dts({
      respectExternal: true,
      compilerOptions: { baseUrl: '.', paths: { '@glitterfx/*': ['../*/dist/index.d.ts'] } },
    }),
  ],
}));

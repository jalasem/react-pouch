import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";
import dts from "rollup-plugin-dts";

const external = ["react"];

export default [
  // ESM and CJS builds
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "cjs",
        sourcemap: true,
      },
      {
        file: "dist/index.esm.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    external,
    plugins: [
      resolve(),
      commonjs(),
      typescript({ 
        tsconfig: "./tsconfig.json",
        declaration: false,
        declarationMap: false 
      }),
      babel({
        babelHelpers: "bundled",
        presets: ["@babel/preset-env", "@babel/preset-react"],
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      }),
    ],
  },
  // Type definitions
  {
    input: "src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    external,
    plugins: [dts()],
  },
];

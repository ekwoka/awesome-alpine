import * as esbuild from 'esbuild-wasm';
import esbuildWASM from 'esbuild-wasm/esbuild.wasm?url';

let esbuildWorker = null;

const createWorker = () =>
  esbuild.initialize({
    wasmURL: esbuildWASM,
  });

export const transpile = async (content: string) => {
  await (esbuildWorker ??= createWorker());
  const result = await esbuild.transform(content, { loader: 'ts' });
  return result.code;
};

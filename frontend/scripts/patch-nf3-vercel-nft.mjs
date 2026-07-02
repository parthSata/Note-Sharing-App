import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const traceFile = join(process.cwd(), "node_modules", "nf3", "dist", "_chunks", "trace.mjs");

if (!existsSync(traceFile)) {
  process.exit(0);
}

const source = readFileSync(traceFile, "utf8");
const namedImport = 'import { nodeFileTrace } from "@vercel/nft";';
const defaultImport = [
  'import vercelNft from "@vercel/nft";',
  "const { nodeFileTrace } = vercelNft;",
].join("\n");

if (source.includes(namedImport)) {
  writeFileSync(traceFile, source.replace(namedImport, defaultImport));
}

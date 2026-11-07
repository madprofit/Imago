import { existsSync } from "node:fs";
import { join } from "node:path";
import Home from "./ImagoHome";

const publicDirectory = join(process.cwd(), "public");

export default function Page() {
  return (
    <Home
      logoWhiteAvailable={existsSync(join(publicDirectory, "imago-logo-white.svg"))}
      logoColorAvailable={existsSync(join(publicDirectory, "imago-logo.svg.svg"))}
      wordmarkWhiteAvailable={existsSync(
        join(publicDirectory, "imago-wordmark-white.svg")
      )}
      butterflyScriptAvailable={existsSync(
        join(publicDirectory, "butterfly-loop.js")
      )}
    />
  );
}

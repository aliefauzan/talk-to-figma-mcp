// Send one command straight to the Figma plugin through the local relay,
// bypassing the MCP server (useful for plugin commands without an MCP tool).
//
// Usage: bun scripts/figma-cmd.ts <channel> <command> [params.json | '{"inline":"json"}'] [--out dir]
// Images in the result (imageData / data fields) are written to --out (default: cwd).
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const outDir = outIdx >= 0 ? args.splice(outIdx, 2)[1] : process.cwd();
const [channel, command, rawParams] = args;
if (!channel || !command) {
  console.error("Usage: bun scripts/figma-cmd.ts <channel> <command> [params.json | json] [--out dir]");
  process.exit(2);
}
const params = !rawParams
  ? {}
  : rawParams.trim().startsWith("{")
    ? JSON.parse(rawParams)
    : await Bun.file(rawParams).json();

const port = process.env.FIGMA_RELAY_PORT || "3055";
const ws = new WebSocket(`ws://localhost:${port}`);
const id = crypto.randomUUID();
const timer = setTimeout(() => {
  console.error("Timed out waiting for Figma (is the plugin connected to this channel?)");
  process.exit(1);
}, Number(process.env.FIGMA_TIMEOUT_MS || 120000));

async function saveImages(result: unknown) {
  const items = Array.isArray(result) ? result : [result];
  let n = 0;
  for (const item of items as any[]) {
    const b64 = item?.imageData ?? item?.data;
    if (typeof b64 !== "string") continue;
    const ext = item.format ? String(item.format).toLowerCase() : "png";
    const file = join(outDir, `${String(item.id ?? item.nodeId ?? n).replace(/[:;]/g, "-")}.${ext}`);
    mkdirSync(outDir, { recursive: true });
    await Bun.write(file, Buffer.from(b64, "base64"));
    item.imageData ? (item.imageData = file) : (item.data = file);
    n++;
  }
}

ws.onopen = () => ws.send(JSON.stringify({ type: "join", channel }));
ws.onmessage = async (ev) => {
  const data = JSON.parse(String(ev.data));
  if (data.type === "system" && String(data.message?.result ?? data.message).includes("Connected to channel")) {
    ws.send(JSON.stringify({ id, type: "message", channel, message: { id, command, params: { ...params, commandId: id } } }));
    return;
  }
  const msg = data.message;
  if (!msg || msg.id !== id || (msg.result === undefined && !msg.error)) return;
  clearTimeout(timer);
  if (msg.error) {
    console.error(JSON.stringify({ error: msg.error }));
    process.exit(1);
  }
  await saveImages(msg.result);
  console.log(typeof msg.result === "string" ? msg.result : JSON.stringify(msg.result, null, 1));
  ws.close();
  process.exit(0);
};

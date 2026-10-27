# Local patches (branch `shoo`)

Based on upstream `grab/cursor-talk-to-figma-mcp` at `ddd90f3`.

## Security

- `src/socket.ts`: relay binds to `127.0.0.1` only (Bun defaults to `0.0.0.0`).
- `src/cursor_mcp_plugin/manifest.json`: Google Analytics removed from the allowed domains.
- `src/cursor_mcp_plugin/ui.html`: analytics `send()` returns immediately.

## Plugin permissions

`manifest.json` asks for `teamlibrary` (library variables) and `currentuser` (`whoami`).
After a manifest change, re-import the plugin in Figma Desktop; a plain re-run keeps the old permissions.

## Extra plugin commands

These run in Figma Desktop, so they use your local fonts (SF Pro etc.) and do not
count against the hosted Figma MCP rate limit. They have no MCP tool yet; call them
with the CLI below.

| Command | Hosted Figma MCP equivalent | Params |
|---|---|---|
| `run_script` | `use_figma` | `code` (body of an async function with `figma`, `params`), `params` |
| `get_metadata` | `get_metadata` | `nodeId?`, `depth?` (no `nodeId` lists pages) |
| `get_screenshot` | `get_screenshot` | `nodeId`, `maxDimension?` (1024), `format?` |
| `get_design_context` | `get_design_context` | `nodeId?` (else selection), `depth?` (6) |
| `get_variable_defs` | `get_variable_defs` | `nodeId?` |
| `search_design_system` | `search_design_system` | `query`, `types?`, `includeLibraries?`, `allPages?`, `limit?` |
| `get_libraries` | `get_libraries` | none (only libraries that publish variables) |
| `get_figjam` | `get_figjam` | `nodeId?` (FigJam files only) |
| `whoami` | `whoami` | none |
| `download_assets` | `download_assets` | `nodeIds`, `format?`, `scale?` |
| `upload_asset` | `upload_assets` | `base64`, `nodeId?`, `name?`, `scaleMode?`, `width?`, `height?` |
| `read_fills` | none | `nodeIds` |
| `upsert_paint_styles` | none | `styles: [{ name, hex?, opacity?, gradient?, fromNodeImage?, cleanExport?, scale?, description? }]` |
| `build_state_swatches` | none | `x`, `y`, `title?`, `items: [{ label, base, bg, text, hex, usage }]` (style names) |

Not possible from a plugin: `create_new_file`, Code Connect, `generate_image`,
`generate_diagram`, shaders, generative plugins, `export_video`, `weave_*`.

## CLI

```bash
bun scripts/figma-cmd.ts <channel> <command> ['{"json":"params"}' | params.json] [--out dir]
```

Images in the result (`imageData` / `data`) are written to `--out`.
If you edit `code.js` while the plugin is open, Figma hot-reloads it and the channel ID changes.

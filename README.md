# Prompt Trimmer

A tiny offline-first UI to trim repeated words or phrases from long text before sending to AI tools.

 - Live demo: https://suketupatel116.github.io/PromptTrimmer/


## Why

- Remove sensitive values (passwords, API keys, hostnames, service names)
- Shrink text before sharing with AI tools
- Keep everything local in your browser (no backend, no network calls)
- Redact service names and redundant text in stack traces to protect sensitive identifiers and reduce payload size.
 - Remove repetitive words and service names from stack traces to reduce size and noise.

## Run

Open `index.html` directly in your browser.

Or, if you want a local static server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Usage

1. Paste text in the left pane.
2. Add remove rules by either:
   - selecting text and clicking **Remove Selected Text**
   - clicking a token in the right pane
3. The output pane updates immediately and removes every occurrence of each rule.
4. Use **Copy Output** when ready.

## Notes

- Matching is exact and case-sensitive.
- Rules remove plain text occurrences globally.
- Works fully offline once the page is loaded.
 - Matching is exact and case-sensitive. (Optionally we can add case-insensitive rules.)
 - Rules remove plain text occurrences globally; blank lines are removed to reduce tokens.
 - Works fully offline once the page is loaded.

## GitHub Pages / Downloadable bundle

- A fully self-contained `prompt-trimmer.html` is included in the repository root. You can download and open it directly — it runs fully offline.
- To host on GitHub Pages, enable Pages on the repository (set the branch to `main` and root `/`) — `prompt-trimmer.html` will be served at `/prompt-trimmer.html` and is downloadable by users.

 - Live demo: https://suketupatel116.github.io/PromptTrimmer/

const inputText = document.getElementById("input-text");
const outputText = document.getElementById("output-text");
const addSelectionButton = document.getElementById("add-selection");
const clearRulesButton = document.getElementById("clear-rules");
const copyOutputButton = document.getElementById("copy-output");
const copyOutputInline = document.getElementById("copy-output-inline");
const downloadOfflineBtn = document.getElementById("download-offline");
const rulesList = document.getElementById("rules-list");
const statusText = document.getElementById("status");

const removeRules = new Set();
const currentTokens = [];
const selectedTokens = new Set();
let lastSelectedIndex = null;
const addSelectedRuleButton = document.getElementById("add-selected-rule");

function escapeRegExp(text) {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

function getSanitizedText(source) {
  let result = source;

  for (const rule of removeRules) {
    if (!rule) continue;
    const escaped = escapeRegExp(rule);
    try {
      const pattern = new RegExp(escaped, "g");
      result = result.replace(pattern, "");
    } catch (e) {
      result = result.split(rule).join("");
    }
  }

  // Collapse repeated spaces inside each line (preserve leading indentation)
  result = result
    .split("\n")
    .map((line) => {
      const m = line.match(/^(\s*)(.*)$/);
      if (!m) return line;
      const leading = m[1] || "";
      const rest = m[2] || "";
      const collapsed = rest.replace(/[ \t]{2,}/g, " ");
      return leading + collapsed;
    })
    .join("\n");

  // Remove fully empty lines to minimize token footprint
  result = result
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join("\n");

  return result;
}

function addRule(rawRule) {
  const rule = rawRule.trim();
  if (!rule) {
    statusText.textContent = "Select a word or phrase first.";
    return;
  }

  if (!removeRules.has(rule)) {
    removeRules.add(rule);
    statusText.textContent = `Added rule: \"${rule}\"`;
  } else {
    statusText.textContent = `Rule already exists: \"${rule}\"`;
  }

  render();
}

function renderRules() {
  rulesList.innerHTML = "";

  if (removeRules.size === 0) {
    const placeholder = document.createElement("span");
    placeholder.textContent = "No active rules.";
    placeholder.className = "hint";
    rulesList.appendChild(placeholder);
    return;
  }

  for (const rule of removeRules) {
    const chip = document.createElement("span");
    chip.className = "rule-chip";

    const label = document.createElement("span");
    label.textContent = rule;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "x";
    removeButton.title = `Remove rule ${rule}`;
    removeButton.addEventListener("click", () => {
      removeRules.delete(rule);
      statusText.textContent = `Removed rule: \"${rule}\"`;
      render();
    });

    chip.appendChild(label);
    chip.appendChild(removeButton);
    rulesList.appendChild(chip);
  }
}

function renderOutputWithClickableWords(text) {
  outputText.innerHTML = "";

  if (!text) {
    outputText.textContent = "";
    currentTokens.length = 0;
    return;
  }

  const parts = text.split(/(\s+)/);
  currentTokens.length = 0;
  let tokenIndex = 0;

  for (const part of parts) {
    if (!part) continue;

    if (/^\s+$/.test(part)) {
      outputText.appendChild(document.createTextNode(part));
      continue;
    }

    currentTokens.push(part);

    const token = document.createElement("span");
    token.className = "token";
    token.textContent = part;
    token.dataset.index = String(tokenIndex);
    token.title = "Click to remove all occurrences of this token (click), or Shift/Ctrl+click to multi-select";

    token.addEventListener("click", (ev) => {
      const i = Number(token.dataset.index);

      if (ev.shiftKey && lastSelectedIndex !== null) {
        const a = Math.min(lastSelectedIndex, i);
        const b = Math.max(lastSelectedIndex, i);
        for (let k = a; k <= b; k++) selectedTokens.add(k);
        lastSelectedIndex = i;
        updateSelectedVisuals();
        return;
      }

      if (ev.ctrlKey || ev.metaKey) {
        if (selectedTokens.has(i)) selectedTokens.delete(i);
        else selectedTokens.add(i);
        lastSelectedIndex = i;
        updateSelectedVisuals();
        return;
      }

      // plain click: add single-token rule
      addRule(part);
    });

    outputText.appendChild(token);
    tokenIndex++;
  }

  // apply selection visuals if any
  updateSelectedVisuals();
}

function updateSelectedVisuals() {
  const tokenEls = outputText.querySelectorAll('.token');
  tokenEls.forEach((el) => {
    const i = Number(el.dataset.index);
    if (selectedTokens.has(i)) el.classList.add('selected');
    else el.classList.remove('selected');
  });
}

function render() {
  const sanitized = getSanitizedText(inputText.value);
  renderOutputWithClickableWords(sanitized);
  renderRules();

  if (removeRules.size === 0) {
    statusText.textContent = "No rules yet.";
  }
}

function getCurrentSelectionText() {
  const active = document.activeElement;

  if (active === inputText) {
    const selected = inputText.value.slice(inputText.selectionStart, inputText.selectionEnd);
    return selected.trim();
  }

  const selected = window.getSelection()?.toString() || "";
  return selected.trim();
}

inputText.addEventListener("input", render);

addSelectionButton.addEventListener("click", () => {
  const selectedText = getCurrentSelectionText();
  addRule(selectedText);
});

clearRulesButton.addEventListener("click", () => {
  removeRules.clear();
  statusText.textContent = "Rules cleared.";
  render();
});

copyOutputButton.addEventListener("click", async () => {
  const text = getSanitizedText(inputText.value);

  if (!navigator.clipboard) {
    statusText.textContent = "Clipboard API unavailable in this browser.";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    statusText.textContent = "Output copied to clipboard.";
  } catch {
    statusText.textContent = "Unable to copy output.";
  }
});

if (copyOutputInline) {
  copyOutputInline.addEventListener('click', () => copyOutputButton.click());
}

if (downloadOfflineBtn) {
  downloadOfflineBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = '/prompt-trimmer.html';
    a.download = 'prompt-trimmer.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
}


// Add selected tokens -> rule button
if (addSelectedRuleButton) {
  addSelectedRuleButton.addEventListener("click", () => {
    if (selectedTokens.size === 0) {
      statusText.textContent = "No tokens selected.";
      return;
    }

    const indices = Array.from(selectedTokens).sort((a, b) => a - b);
    const phrase = indices.map((i) => currentTokens[i]).join(" ");
    addRule(phrase);

    // clear selection after adding
    selectedTokens.clear();
    lastSelectedIndex = null;
    updateSelectedVisuals();
  });
}

render();

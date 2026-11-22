// Makes user input safe to use inside a regular expression.

export function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
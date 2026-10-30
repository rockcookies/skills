# {{name}}

<!-- TODO(ctx): In 1-3 sentences, state what this repo does and who it is for. Read the code and README first; do not invent. -->

{{#units}}
## Repo layout

{{block:units}}

<!-- TODO(ctx): one line per top-level directory saying what it is for. The paths in the table are script-generated facts; the descriptions are human-written conventions. -->

{{/units}}
{{#commands}}
## Common commands

{{block:commands}}

{{/commands}}
## Global conventions

<!-- TODO(ctx): only conventions that hold for every task in this repo (naming, error handling, commit rules, test requirements). Specialized content goes into docs/ and is routed below. -->

{{#doc-routes}}
## Doc routes (read first)

{{block:doc-routes}}

{{/doc-routes}}
## Scope rules

- When working in a subdirectory, the nearest `AGENTS.md` wins; child files only carry what is specific to that directory, never a repeat of this file.
- Between the ctx:begin / ctx:end comments is script-generated content. Do not edit it by hand; change the source (code, doc frontmatter) and re-sync.

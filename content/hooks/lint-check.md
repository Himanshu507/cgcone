---
name: lint-check
category: automation
description: Run linting checks after code edits to catch issues early.
event: PostToolUse
matcher: Edit|Write
language: bash
tags: [linting, automation, code-quality]
---

Execute ESLint, Pylint, or other language-specific linters after file modifications to enforce code style rules and catch potential bugs.

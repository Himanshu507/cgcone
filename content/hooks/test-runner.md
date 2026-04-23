---
name: test-runner
category: automation
description: Automatically run relevant tests after code changes.
event: PostToolUse
matcher: Edit|Write
language: bash
tags: [testing, automation, ci]
---

Detect changed files and run the associated test suite automatically after code modifications to catch regressions immediately.

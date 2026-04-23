---
name: log-commands
category: monitoring
description: Log all executed commands and tool invocations to an audit file.
event: PostToolUse
matcher: Bash
language: bash
tags: [logging, audit, monitoring]
---

Record all bash commands executed during a Claude Code session to a timestamped audit log for debugging and compliance purposes.

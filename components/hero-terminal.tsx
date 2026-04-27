"use client"

import { useEffect, useRef } from "react"

export function HeroTerminal() {
  const bodyRef  = useRef<HTMLDivElement>(null)
  const stopRef  = useRef(false)

  useEffect(() => {
    stopRef.current = false
    const body = bodyRef.current
    if (!body) return

    // ── helpers ────────────────────────────────────
    const sleep = (ms: number) =>
      new Promise<void>(r => {
        const id = setTimeout(r, ms)
        // no cancellation needed - stopRef checked at scene boundaries
        void id
      })

    function scrollBottom() {
      if (body) body.scrollTop = body.scrollHeight
    }

    function appendLine(html: string) {
      if (!body) return
      const d = document.createElement("div")
      d.className = "ht-line ht-slide"
      d.innerHTML = html
      body.appendChild(d)
      scrollBottom()
    }

    function blankLine() {
      if (!body) return
      const d = document.createElement("div")
      d.className = "ht-line"
      d.innerHTML = "&nbsp;"
      body.appendChild(d)
      scrollBottom()
    }

    function idleCursor() {
      if (!body) return null
      const d = document.createElement("div")
      d.className = "ht-line"
      d.innerHTML = `<span class="ht-ps">$</span><span class="ht-cur"></span>`
      body.appendChild(d)
      scrollBottom()
      return d
    }

    async function typeCmd(text: string, speed = 36) {
      if (!body) return
      const row = document.createElement("div")
      row.className = "ht-line"
      row.innerHTML = `<span class="ht-ps">$</span><span class="ht-ct" id="ct"></span><span class="ht-cur" id="cur"></span>`
      body.appendChild(row)
      scrollBottom()
      const ct  = row.querySelector<HTMLElement>("#ct")!
      const cur = row.querySelector<HTMLElement>("#cur")!
      for (const ch of text) {
        if (stopRef.current) return
        ct.textContent += ch
        scrollBottom()
        await sleep(speed + Math.random() * 16)
      }
      cur.style.display = "none"
    }

    // ── main loop ──────────────────────────────────
    async function run() {
      if (stopRef.current || !body) return
      body.innerHTML = ""

      await sleep(400)

      // idle cursor
      const idle = idleCursor()
      await sleep(600)
      idle?.remove()

      if (stopRef.current) return

      // ── SCENE 1: scan ──────────────────────────
      await typeCmd("cgcone scan")
      await sleep(280)
      blankLine()
      appendLine(`<span class="ht-dim">  Detecting AI CLI tools...</span>`)
      await sleep(550)
      appendLine(`<span class="ht-ind"><span class="ht-ok">✓</span>  <span class="ht-w">Claude Code</span>    <span class="ht-m">~/.claude.json</span></span>`)
      await sleep(220)
      appendLine(`<span class="ht-ind"><span class="ht-ok">✓</span>  <span class="ht-w">Gemini CLI</span>     <span class="ht-m">~/.gemini/settings.json</span></span>`)
      await sleep(220)
      appendLine(`<span class="ht-ind"><span class="ht-ok">✓</span>  <span class="ht-w">OpenAI Codex</span>   <span class="ht-m">~/.codex/config.toml</span></span>`)
      await sleep(220)
      appendLine(`<span class="ht-ind"><span class="ht-ok">✓</span>  <span class="ht-w">Copilot CLI</span>    <span class="ht-m">~/.copilot/mcp-config.json</span></span>`)
      await sleep(380)
      blankLine()
      appendLine(`<span class="ht-ind2"><span class="ht-p">4 CLIs detected</span> <span class="ht-m">- ready to install</span></span>`)
      await sleep(1200)
      blankLine()

      if (stopRef.current) return

      // ── SCENE 2: install ───────────────────────
      await typeCmd("cgcone install brave-search")
      await sleep(280)
      blankLine()
      appendLine(`<span class="ht-dim">  Searching registry...</span>`)
      await sleep(650)

      appendLine(`<span class="ht-p">◆</span> <span class="ht-w">Multiple matches - select one:</span>`)
      await sleep(160)

      const p1 = document.createElement("div")
      p1.className = "ht-line ht-slide"
      p1.innerHTML = `<span class="ht-pb"><span class="ht-bon" id="b1">●</span><span class="ht-sel">Brave Search</span>  <span class="ht-m">brave-brave-search-mcp-server</span>  <span class="ht-tag">[npm]</span></span>`
      body.appendChild(p1)
      scrollBottom()
      await sleep(140)

      const p2 = document.createElement("div")
      p2.className = "ht-line ht-slide"
      p2.innerHTML = `<span class="ht-pb"><span class="ht-boff">○</span><span class="ht-pdim">docker-brave-search</span>  <span class="ht-tagd">[docker]</span></span>`
      body.appendChild(p2)
      scrollBottom()
      await sleep(140)

      const pend = document.createElement("div")
      pend.className = "ht-line ht-slide"
      pend.innerHTML = `<span style="color:#2a2a2a;margin-left:2px">└</span>`
      body.appendChild(pend)
      scrollBottom()
      await sleep(900)

      // confirm npm selection
      const b1 = p1.querySelector<HTMLElement>("#b1")
      if (b1) b1.style.color = "#22c55e"
      await sleep(380)

      if (stopRef.current) return

      // API key prompt
      blankLine()
      appendLine(`<span class="ht-p">◆</span> <span class="ht-w">BRAVE_API_KEY</span> <span class="ht-m">- Brave Search API key</span>`)
      await sleep(280)

      const mrow = document.createElement("div")
      mrow.className = "ht-line ht-slide"
      mrow.innerHTML = `<span style="color:#2a2a2a;margin-left:2px">│</span> <span class="ht-mask" id="dots"></span><span class="ht-cur" id="mc"></span>`
      body.appendChild(mrow)
      scrollBottom()

      const dotsEl = mrow.querySelector<HTMLElement>("#dots")!
      const mc     = mrow.querySelector<HTMLElement>("#mc")!
      for (let i = 0; i < 18; i++) {
        if (stopRef.current) return
        dotsEl.textContent += "•"
        scrollBottom()
        await sleep(55 + Math.random() * 30)
      }
      mc.style.display = "none"
      await sleep(280)

      const mend = document.createElement("div")
      mend.className = "ht-line ht-slide"
      mend.innerHTML = `<span style="color:#2a2a2a;margin-left:2px">└</span>`
      body.appendChild(mend)
      scrollBottom()
      await sleep(450)
      blankLine()
      appendLine(`<span class="ht-ind"><span class="ht-ok">✓</span> <span class="ht-m">Env vars saved</span></span>`)
      await sleep(550)

      if (stopRef.current) return

      // ── SCENE 3: success ───────────────────────
      blankLine()
      appendLine(`<span class="ht-dim">  Installing to all detected CLIs...</span>`)
      await sleep(600)
      appendLine(`<span class="ht-ind"><span class="ht-ok">✓</span>  <span class="ht-w">Claude Code</span>   <span class="ht-m">→ configured</span></span>`)
      await sleep(200)
      appendLine(`<span class="ht-ind"><span class="ht-ok">✓</span>  <span class="ht-w">Gemini CLI</span>    <span class="ht-m">→ configured</span></span>`)
      await sleep(200)
      appendLine(`<span class="ht-ind"><span class="ht-ok">✓</span>  <span class="ht-w">OpenAI Codex</span>  <span class="ht-m">→ configured</span></span>`)
      await sleep(200)
      appendLine(`<span class="ht-ind"><span class="ht-ok">✓</span>  <span class="ht-w">Copilot CLI</span>   <span class="ht-m">→ configured</span></span>`)
      await sleep(450)
      blankLine()
      appendLine(`<span class="ht-ind"><span class="ht-ok">✓</span> <span class="ht-w">brave-brave-search-mcp-server</span> <span class="ht-p">installed</span></span>`)
      await sleep(700)

      idleCursor()
      await sleep(2000)

      if (stopRef.current) return
      run()
    }

    run()

    return () => {
      stopRef.current = true
    }
  }, [])

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card shadow-[0_0_50px_hsl(var(--primary)/0.07)] shadow-2xl">
      {/* Terminal bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-secondary border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <span className="ml-2 text-xs text-muted-foreground font-mono">cgcone - terminal</span>
      </div>

      {/* Animated body */}
      <div
        ref={bodyRef}
        className="p-5 font-mono text-sm leading-relaxed hero-terminal-body"
        style={{
          height: "290px",
          overflowY: "hidden",
        }}
      />

      <style>{`
        .ht-line  { display: flex; align-items: baseline; white-space: pre; line-height: 1.75; }
        .ht-slide { animation: ht-slidein 0.22s ease forwards; }

        .ht-ps  { color: hsl(var(--primary)); margin-right: 8px; }
        .ht-ct  { color: hsl(var(--foreground)); }
        .ht-cur {
          display: inline-block; width: 7px; height: 13px;
          background: hsl(var(--primary)); vertical-align: text-bottom;
          margin-left: 1px; animation: ht-blink 1s step-end infinite;
        }
        .ht-ok   { color: #22c55e; }
        .ht-dim  { color: hsl(var(--muted-foreground) / 0.5); }
        .ht-m    { color: hsl(var(--muted-foreground)); }
        .ht-w    { color: hsl(var(--foreground)); }
        .ht-p    { color: hsl(var(--primary)); }
        .ht-ind  { margin-left: 16px; }
        .ht-ind2 { margin-left: 28px; }
        .ht-pb   { border-left: 2px solid hsl(var(--primary)); margin: 1px 0; padding-left: 10px; }
        .ht-bon  { color: hsl(var(--primary)); margin-right: 8px; }
        .ht-boff { color: hsl(var(--muted-foreground) / 0.2); margin-right: 8px; }
        .ht-sel  { color: hsl(var(--foreground)); }
        .ht-pdim { color: hsl(var(--muted-foreground) / 0.4); }
        .ht-tag  { color: #4ade80; font-size: 11px; }
        .ht-tagd { color: hsl(var(--muted-foreground) / 0.3); font-size: 11px; }
        .ht-mask { color: hsl(var(--muted-foreground)); letter-spacing: 2px; }

        @keyframes ht-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes ht-slidein {
          from { opacity: 0; transform: translateX(-5px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

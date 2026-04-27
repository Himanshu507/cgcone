import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for cgcone - rules and conditions for using our platform.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-3xl">
        <h1 className="text-display-2 mb-3">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: April 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Acceptance</h2>
            <p>
              By using cgcone - the website, desktop application, or CLI - you agree to these Terms of Service.
              If you do not agree, do not use cgcone.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p>
              cgcone provides a marketplace directory of AI CLI extensions (MCP servers, plugins, skills,
              hooks, subagents, and commands) and a desktop application and CLI for managing those extensions
              across multiple AI CLI tools (Claude Code, Gemini CLI, OpenAI Codex, GitHub Copilot CLI, and others).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Use of the Service</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use cgcone for any unlawful purpose.</li>
              <li>Submit malicious, deceptive, or harmful extension listings.</li>
              <li>Attempt to disrupt or overload our infrastructure.</li>
              <li>Scrape or mirror the registry in ways that abuse our systems.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Marketplace Content</h2>
            <p>
              The cgcone marketplace lists community-contributed extensions. We curate listings but do not
              endorse, verify the security of, or take responsibility for third-party extensions. Install
              extensions only from sources you trust. Always review extension code before installation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Open Source</h2>
            <p>
              cgcone is open source software released under the{" "}
              <a
                href="https://github.com/Himanshu507/cgcone/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                MIT License
              </a>
              . You are free to use, modify, and distribute it in accordance with that license.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Disclaimer of Warranties</h2>
            <p>
              cgcone is provided &quot;as is&quot; without warranty of any kind. We make no guarantees about
              uptime, accuracy of registry data, or compatibility of listed extensions with your environment.
              Use at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, cgcone and its creator shall not be liable for any
              indirect, incidental, or consequential damages arising from your use of the service or any
              extension installed through it.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Changes to Terms</h2>
            <p>
              We reserve the right to update these terms. Continued use after changes constitutes acceptance.
              The updated date at the top of this page reflects the latest revision.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Contact</h2>
            <p>
              Questions?{" "}
              <a
                href="https://github.com/Himanshu507/cgcone/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Open an issue on GitHub
              </a>{" "}
              or visit{" "}
              <a
                href="https://himanshudev.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                himanshudev.in
              </a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}

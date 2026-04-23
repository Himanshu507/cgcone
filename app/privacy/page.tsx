import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for cgcone — how we collect, use, and protect your information.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-display-2 mb-3">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: April 2026</p>

        <div className="prose-custom space-y-10 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Overview</h2>
            <p>
              cgcone (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the cgcone website at cgcone.vercel.app and the cgcone
              desktop application and CLI. This Privacy Policy explains what information we collect, how we use it,
              and the choices you have.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <p className="mb-3">
              <strong className="text-foreground">Website:</strong> cgcone.vercel.app is a static informational site. We do not
              collect personal information directly. Vercel, our hosting provider, may collect standard server
              logs (IP address, browser, referring URL) for security and performance purposes.
            </p>
            <p>
              <strong className="text-foreground">Desktop app and CLI:</strong> The cgcone application runs locally on your machine.
              It does not transmit personal data to our servers. Any API keys you store are kept in your
              operating system&apos;s native keychain (macOS Keychain or Windows Credential Manager) and never
              leave your device.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Registry Data</h2>
            <p>
              The marketplace registry is fetched from our public GitHub repository. This is read-only data
              (MCP server listings, plugin metadata). No user data is sent in these requests beyond what
              your browser or HTTP client includes by default.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Third-Party Services</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-foreground">Vercel</strong> — website hosting and analytics. Subject to Vercel&apos;s privacy policy.</li>
              <li><strong className="text-foreground">GitHub</strong> — source code and registry hosting. Subject to GitHub&apos;s privacy policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Cookies</h2>
            <p>
              The website uses a single localStorage key (<code className="font-mono text-xs bg-secondary px-1 py-0.5 rounded text-foreground">cgcone-theme</code>) to
              persist your dark/light theme preference. No tracking cookies are set.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Data Retention</h2>
            <p>
              We do not store personal data on our servers. Theme preferences are stored locally in your
              browser and can be cleared at any time by clearing your browser&apos;s local storage.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this policy as the product evolves. Changes will be reflected on this page
              with an updated date. Continued use of cgcone constitutes acceptance of any updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Contact</h2>
            <p>
              Questions about this policy? Reach out via{" "}
              <a
                href="https://github.com/Himanshu507/cgcone_web/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub Issues
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

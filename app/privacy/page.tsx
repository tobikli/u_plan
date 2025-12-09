"use client";

import { Footer } from "@/components/footer";
import { ModeToggle } from "@/components/theme-toggle";

export default function PrivacyPolicy() {
  const lastUpdated = "December 9, 2025";
  let url = "uplan.local";
  if (typeof window !== "undefined") {
    url = window.location.host;
  }
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="fixed top-5 right-5 z-50">
        <ModeToggle />
      </div>      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="space-y-3 border-b pb-6">
          <p className="text-sm font-medium text-primary">Privacy</p>
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="mt-8 space-y-8 text-sm leading-6 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <p>
              This Privacy Policy describes how we collect, use, and safeguard
              personal data when you use UPlan. We process personal data in
              accordance with applicable data protection laws, including the EU
              General Data Protection Regulation (GDPR) where relevant.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Who We Are
            </h2>
            <p>
              UPlan is operated by the site owner (&quot;we,&quot;
              &quot;us,&quot; or &quot;our&quot;). For privacy-related
              inquiries, please contact:
              <a
                className="ml-1 text-primary underline"
                href={"mailto:privacy@" + url}
              >
                privacy@{url}
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Personal Data We Collect
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Account data: name, email address, authentication identifiers.
              </li>
              <li>
                Usage data: app interactions, pages visited, and feature usage.
              </li>
              <li>
                Device/technical data: browser type, operating system, IP
                address.
              </li>
              <li>
                Content you provide: programs, courses, and related notes you
                enter.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              How We Use Personal Data
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                To provide and maintain the UPlan service and user accounts.
              </li>
              <li>To authenticate users and secure access.</li>
              <li>To improve, troubleshoot, and monitor performance.</li>
              <li>
                To communicate about service updates, security, and support.
              </li>
              <li>To comply with legal obligations and enforce our terms.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Legal Bases (GDPR)
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Performance of a contract: providing the service you sign up
                for.
              </li>
              <li>Legitimate interests: improving and securing the service.</li>
              <li>
                Consent: where required for certain communications or optional
                features.
              </li>
              <li>Legal obligation: complying with applicable laws.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Data Sharing
            </h2>
            <p>
              We may share data with service providers (e.g., hosting,
              analytics, authentication) who process data on our behalf under
              data protection agreements. We do not sell personal data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              International Transfers
            </h2>
            <p>
              If data is transferred outside the EU/EEA, we use appropriate
              safeguards such as standard contractual clauses or equivalent
              measures, where required.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Data Retention
            </h2>
            <p>
              We retain personal data for as long as needed to provide the
              service, comply with legal obligations, resolve disputes, and
              enforce agreements. Account data is deleted when you delete your
              account or request deletion, subject to legal retention
              requirements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Your Rights (GDPR/EEA, UK)
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Access your personal data.</li>
              <li>Rectify inaccurate or incomplete data.</li>
              <li>Erase data (right to be forgotten) where applicable.</li>
              <li>
                Restrict or object to processing in certain circumstances.
              </li>
              <li>Data portability for data you provided.</li>
              <li>
                Withdraw consent at any time where processing is based on
                consent.
              </li>
              <li>Lodge a complaint with your supervisory authority.</li>
            </ul>
            <p>
              To exercise your rights, contact us at
              <a
                className="ml-1 text-primary underline"
                href={"mailto:privacy@" + url}
              >
                privacy@{url}
              </a>{" "}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Security</h2>
            <p>
              We implement technical and organizational measures to protect
              personal data, including access controls, encryption in transit,
              and monitoring. No method is 100% secure, so we encourage strong
              passwords and responsible account usage.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Cookies and Similar Technologies
            </h2>
            <p>
              We may use cookies or similar technologies for authentication,
              security, and essential functionality. Where required by law, we
              will request consent for non-essential cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Third-Party Links
            </h2>
            <p>
              The service may contain links to third-party sites. We are not
              responsible for their privacy practices. Please review their
              policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Children&apos;s Privacy
            </h2>
            <p>
              UPlan is not directed to children under 16, and we do not
              knowingly collect personal data from children under 16. If you
              believe a child has provided data, contact us to delete it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Changes to This Policy
            </h2>
            <p>
              We may update this policy periodically. We will post the updated
              version with a new &quot;Last updated&quot; date. Material changes
              may be communicated through the app.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p>
              Questions or requests:{" "}
              <a
                className="ml-1 text-primary underline"
                href={"mailto:privacy@" + url}
              >
                privacy@{url}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}

import { AppSidebarLayout } from "@/components/app-sidebar-layout";

export default function PrivacyPage() {
  return (
    <AppSidebarLayout>
      <div className="flex flex-1 flex-col p-6 lg:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: July 26, 2026
        </p>

        <div className="mt-8 max-w-3xl space-y-8 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              1. Introduction
            </h2>
            <p>
              This Privacy Policy describes how LabFlow (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;) collects, uses, and
              protects information when you use our laboratory workflow
              management platform (the &quot;Service&quot;). We are
              committed to protecting your privacy and handling your data
              with transparency and care.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              2. Information We Collect
            </h2>
            <p className="mb-2">
              <strong className="text-foreground">
                Account Information:
              </strong>{" "}
              When you register, we collect your email address, organization
              name, and authentication credentials (managed through
              Firebase Authentication). We do not store passwords directly.
            </p>
            <p className="mb-2">
              <strong className="text-foreground">
                Laboratory Data:
              </strong>{" "}
              Sample records, workflow templates, stage history, and audit
              logs you create within the Service. This data is owned by your
              organization.
            </p>
            <p className="mb-2">
              <strong className="text-foreground">Usage Data:</strong>{" "}
              Information about how you interact with the Service, including
              page views, feature usage, and device/browser information for
              analytics and improvement purposes.
            </p>
            <p>
              <strong className="text-foreground">Payment Data:</strong>{" "}
              Billing information is processed by Stripe. We do not store
              credit card numbers or payment details on our servers. See
              Stripe&apos;s{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Privacy Policy
              </a>{" "}
              for details.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              3. How We Use Your Information
            </h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>To provide, maintain, and improve the Service</li>
              <li>To authenticate users and secure your account</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send service-related communications (e.g., security alerts)</li>
              <li>To respond to support requests and inquiries</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              4. Data Sharing
            </h2>
            <p>
              We do not sell your personal information or laboratory data to
              third parties. We may share information with:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>
                <strong className="text-foreground">Service providers:</strong>{" "}
                Firebase (authentication), Stripe (payments), and hosting
                infrastructure providers who process data on our behalf under
                strict contractual obligations
              </li>
              <li>
                <strong className="text-foreground">Legal requirements:</strong>{" "}
                When required by law, subpoena, or government request
              </li>
              <li>
                <strong className="text-foreground">Business transfers:</strong>{" "}
                In connection with a merger, acquisition, or sale of assets,
                with prior notice
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              5. Data Security
            </h2>
            <p>
              We implement industry-standard security measures including
              encryption in transit (TLS), encryption at rest, access
              controls, and regular security audits. All API communication is
              authenticated and authorized. Audit logs are append-only and
              immutable. However, no method of transmission or storage is
              100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              6. Data Retention
            </h2>
            <p>
              Your laboratory data is retained for as long as your account is
              active or as needed to provide the Service. Audit logs are
              retained indefinitely as required for compliance. If you delete
              your account, we will delete or anonymize your personal data
              within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              7. Your Rights
            </h2>
            <p className="mb-2">
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Data portability — receive your data in a structured format</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at{" "}
              <a
                href="mailto:privacy@labflow.dev"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                privacy@labflow.dev
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              8. Cookies
            </h2>
            <p>
              We use a single session cookie to maintain your authentication
              state. This cookie is httpOnly, secure, and expires after 7
              days. We do not use advertising or third-party tracking
              cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              9. Children&apos;s Privacy
            </h2>
            <p>
              The Service is not directed to individuals under 16. We do not
              knowingly collect personal information from children. If you
              believe a child has provided us with personal data, please
              contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Material
              changes will be communicated via email or in-app notification at
              least 30 days before they take effect. The &quot;Last
              updated&quot; date at the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              11. Contact
            </h2>
            <p>
              Questions about this policy? Contact us at{" "}
              <a
                href="mailto:privacy@labflow.dev"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                privacy@labflow.dev
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </AppSidebarLayout>
  );
}

import Link from "next/link";
import { FlaskConical } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2.5 px-6">
          <Link href="/login" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FlaskConical className="size-4.5" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              LabFlow
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: July 26, 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using LabFlow (&quot;the Service&quot;), you agree
              to be bound by these Terms of Service. If you do not agree to
              these terms, do not use the Service. These terms apply to all
              visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              2. Description of Service
            </h2>
            <p>
              LabFlow is a laboratory workflow management platform that enables
              teams to track specimens through configurable workflows, manage
              templates, and maintain audit trails. The Service is provided
              &quot;as is&quot; and &quot;as available&quot; without warranties
              of any kind.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              3. Account Registration
            </h2>
            <p>
              You must provide accurate and complete information when creating
              an account. You are responsible for safeguarding your
              credentials and for all activity that occurs under your account.
              You must notify us immediately of any unauthorized use of your
              account.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              4. Acceptable Use
            </h2>
            <p className="mb-2">
              You agree not to use the Service to:
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                Violate any applicable law or regulation, including those
                governing laboratory operations and data integrity
              </li>
              <li>
                Upload malicious code or interfere with the Service&apos;s
                infrastructure
              </li>
              <li>
                Attempt to gain unauthorized access to other accounts or
                systems
              </li>
              <li>
                Use the Service to store or process data you do not have the
                right to access
              </li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              5. Data and Intellectual Property
            </h2>
            <p>
              You retain ownership of all data you submit to the Service
              (&quot;Your Data&quot;). By using the Service, you grant us a
              limited license to process Your Data solely to provide the
              Service to you. We will not use Your Data for any other purpose
              without your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              6. Subscriptions and Payment
            </h2>
            <p>
              Paid plans are billed in advance on a monthly or annual basis
              through Stripe. All fees are non-refundable except as required
              by law. We reserve the right to modify pricing with 30 days
              advance notice. If you fail to pay, we may suspend or terminate
              your access to the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              7. Service Availability
            </h2>
            <p>
              We strive to maintain high availability but do not guarantee
              uninterrupted access. We may perform maintenance, updates, or
              experience outages. We are not liable for any loss arising
              from downtime or inability to access the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              8. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, LabFlow and its
              operators shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including loss of
              data, revenue, or profits, arising from your use of the Service.
              Our total liability shall not exceed the amount you paid us in
              the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              9. Termination
            </h2>
            <p>
              You may terminate your account at any time by contacting us or
              through the billing portal. We may suspend or terminate your
              access for violation of these terms, with or without notice.
              Upon termination, your right to use the Service ceases
              immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              10. Changes to Terms
            </h2>
            <p>
              We may update these terms from time to time. Material changes
              will be communicated via email or in-app notification at least
              30 days before they take effect. Continued use of the Service
              after changes take effect constitutes acceptance of the updated
              terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              11. Contact
            </h2>
            <p>
              Questions about these terms? Contact us at{" "}
              <a
                href="mailto:support@labflow.dev"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                support@labflow.dev
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

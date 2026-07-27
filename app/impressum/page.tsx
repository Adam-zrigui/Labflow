import { AppSidebarLayout } from "@/components/app-sidebar-layout";

export default function ImpressumPage() {
  return (
    <AppSidebarLayout>
      <div className="flex flex-1 flex-col p-6 lg:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Impressum</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Information pursuant to § 5 TMG
        </p>

        <div className="mt-8 max-w-3xl space-y-8 text-sm leading-relaxed text-foreground/80">
          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Provider
            </h2>
            <p>
              LabFlow
              <br />
              {/* TODO: Replace with your actual name/company */}
              [Your Name / Company Name]
              <br />
              {/* TODO: Replace with your actual address */}
              [Street Address]
              <br />
              [Postal Code, City, Country]
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Contact
            </h2>
            <p>
              Email:{" "}
              <a
                href="mailto:info@labflow.dev"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                info@labflow.dev
              </a>
              <br />
              {/* TODO: Add phone number if applicable */}
              Phone: [+XX XXX XXXXXXX]
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Responsible for Content
            </h2>
            <p>
              {/* TODO: Replace with responsible person per § 55 Abs. 2 RStV */}
              [Responsible Person Name]
              <br />
              [Address as above]
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Dispute Resolution
            </h2>
            <p>
              The European Commission provides a platform for online dispute
              resolution (ODR):{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                https://ec.europa.eu/consumers/odr
              </a>
              .
            </p>
            <p className="mt-2">
              We are not obligated or willing to participate in dispute
              resolution proceedings before a consumer arbitration board.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Liability for Content
            </h2>
            <p>
              As a service provider, we are responsible for our own content
              on these pages in accordance with general laws pursuant to § 7
              Abs. 1 TMG. However, we are not obligated to monitor transmitted
              or stored third-party information or to investigate circumstances
              that indicate illegal activity.
            </p>
            <p className="mt-2">
              Obligations to remove or block the use of information under
              general laws remain unaffected. However, liability in this
              regard is only possible from the point in time at which a
              concrete infringement of a right becomes known. If we become
              aware of any such infringements, we will remove the relevant
              content immediately.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Liability for Links
            </h2>
            <p>
              Our website contains links to external third-party websites. We
              have no influence on the contents of those websites and
              therefore cannot assume any liability for them. The respective
              provider or operator of the pages is always responsible for the
              content of the linked pages.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Copyright
            </h2>
            <p>
              The contents and works created by the site operators on these
              pages are subject to copyright law. Duplication, processing,
              distribution, and any kind of exploitation outside the limits
              of copyright law require the written consent of the respective
              author or creator. Downloads and copies of this site are only
              permitted for private, non-commercial use.
            </p>
          </section>
        </div>
      </div>
    </AppSidebarLayout>
  );
}

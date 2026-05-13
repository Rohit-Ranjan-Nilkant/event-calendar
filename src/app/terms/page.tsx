import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { getPlatformSettings } from "@/lib/platform"

export async function generateMetadata() {
  const s = await getPlatformSettings()
  return { title: `Terms of Service – ${s.platformName}` }
}

export default async function TermsPage() {
  const settings = await getPlatformSettings()
  const externalUrl = settings.termsUrl ?? "https://digitalsherpa.ai/terms-of-service/"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Last updated: {new Date().getFullYear()} · {settings.platformName}
            </p>
          </div>

          {settings.customTermsText ? (
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {settings.customTermsText}
            </div>
          ) : (
            <div className="space-y-5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                By accessing or using {settings.platformName}, a product of{" "}
                <a href="https://digitalsherpa.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  DigitalSherpa
                </a>
                , you agree to the following terms.
              </p>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">1. Use of Service</h2>
                <p>You may use {settings.platformName} for lawful purposes only. You are responsible for all activity that occurs under your account. You must not use the platform to distribute harmful, misleading, or illegal content.</p>
              </section>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">2. Accounts</h2>
                <p>You must provide accurate information when creating an account and keep your credentials secure. We reserve the right to suspend accounts that violate these terms.</p>
              </section>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">3. Event Content</h2>
                <p>Administrators are responsible for the accuracy of events imported or created on the platform. {settings.platformName} aggregates publicly available event data and does not endorse any specific event or organiser.</p>
              </section>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">4. Intellectual Property</h2>
                <p>All software, design, and branding associated with {settings.platformName} is the property of DigitalSherpa. You may not reproduce or distribute any part of the platform without written permission.</p>
              </section>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">5. Limitation of Liability</h2>
                <p>The platform is provided "as is" without warranty of any kind. DigitalSherpa is not liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
              </section>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">6. Changes to Terms</h2>
                <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
              </section>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">7. Contact</h2>
                <p>For any questions regarding these terms please visit{" "}
                  <a href="https://digitalsherpa.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">digitalsherpa.ai</a>.
                </p>
              </section>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <a
              href={externalUrl}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Full terms at digitalsherpa.ai
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

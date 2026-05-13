import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { getPlatformSettings } from "@/lib/platform"

export async function generateMetadata() {
  const s = await getPlatformSettings()
  return { title: `Privacy Policy – ${s.platformName}` }
}

export default async function PrivacyPage() {
  const settings = await getPlatformSettings()
  const externalUrl = settings.privacyPolicyUrl ?? "https://digitalsherpa.ai/privacy-policy/"

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Last updated: {new Date().getFullYear()} · {settings.platformName}
            </p>
          </div>

          {settings.customPrivacyText ? (
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {settings.customPrivacyText}
            </div>
          ) : (
            <div className="space-y-5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <p>
                {settings.platformName} is a product of{" "}
                <a href="https://digitalsherpa.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  DigitalSherpa
                </a>
                . By using this platform you agree to the privacy practices described below.
              </p>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">1. Information We Collect</h2>
                <p>When you create an account we collect your name, email address, and a securely hashed password. We do not collect payment information or government IDs.</p>
              </section>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">2. How We Use Your Information</h2>
                <p>Your information is used solely to operate the {settings.platformName} service — authenticating your account, personalising your event discovery feed, and delivering event reminders through your chosen notification channel.</p>
              </section>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">3. Data Storage</h2>
                <p>All data is stored in a secure, encrypted PostgreSQL database. We retain your account data for as long as your account exists. You may request deletion at any time by contacting the platform administrator.</p>
              </section>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">4. Third-Party Services</h2>
                <p>We do not sell your personal data to any third party. Notification channels (Slack, Discord, webhook) you configure are your own integrations and subject to their respective privacy policies.</p>
              </section>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">5. Cookies</h2>
                <p>We use a single session cookie to keep you signed in. No third-party tracking cookies are set. Your dark-mode preference is stored in <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">localStorage</code> on your device only.</p>
              </section>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">6. Your Rights</h2>
                <p>You have the right to access, correct, or delete any personal information we hold about you. Please contact the platform administrator to exercise these rights.</p>
              </section>

              <section>
                <h2 className="font-semibold text-gray-900 dark:text-white mb-1">7. Contact</h2>
                <p>For privacy-related queries please visit{" "}
                  <a href="https://digitalsherpa.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">digitalsherpa.ai</a>.
                </p>
              </section>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Full policy at digitalsherpa.ai
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

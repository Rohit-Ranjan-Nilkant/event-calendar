import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { getPlatformSettings } from "@/lib/platform"

export async function generateMetadata() {
  const s = await getPlatformSettings()
  return { title: `Privacy Policy – ${s.platformName}` }
}

export default async function PrivacyPage() {
  const settings = await getPlatformSettings()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2 ml-4">
            {settings.logoUrl ? (
              <Image src={settings.logoUrl} alt={settings.platformName} width={28} height={28} className="object-contain" />
            ) : (
              <Image src="/logo.png" alt={settings.platformName} width={28} height={28} className="object-contain" />
            )}
            <span className="font-semibold text-gray-900 dark:text-white">{settings.platformName}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {settings.platformName} is a product of{" "}
          <a href="https://digitalsherpa.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
            DigitalSherpa
          </a>
          . The full privacy policy governing this service is published at digitalsherpa.ai.
        </p>

        {settings.customPrivacyText ? (
          /* Custom text set by admin */
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                {settings.customPrivacyText}
              </p>
            </div>
          </div>
        ) : settings.privacyPolicyUrl ? (
          /* External URL configured */
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <iframe
              src={settings.privacyPolicyUrl}
              className="w-full"
              style={{ height: "80vh", border: "none" }}
              title="Privacy Policy"
            />
          </div>
        ) : (
          /* Default: embed digitalsherpa.ai policy */
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <iframe
              src="https://digitalsherpa.ai/privacy-policy/"
              className="w-full"
              style={{ height: "80vh", border: "none" }}
              title="DigitalSherpa Privacy Policy"
            />
          </div>
        )}

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
          View directly at{" "}
          <a
            href={settings.privacyPolicyUrl ?? "https://digitalsherpa.ai/privacy-policy/"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            {settings.privacyPolicyUrl ?? "digitalsherpa.ai/privacy-policy"}
          </a>
        </p>
      </div>
    </div>
  )
}

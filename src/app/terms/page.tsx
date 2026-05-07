import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Terms of Service – DS EventHub" }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2 ml-4">
            <Image src="/logo.png" alt="DS EventHub" width={28} height={28} className="object-contain" />
            <span className="font-semibold text-gray-900 dark:text-white">DS EventHub</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          DS EventHub is a product of{" "}
          <a href="https://digitalsherpa.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
            DigitalSherpa
          </a>
          . By using this service you agree to the terms published at digitalsherpa.ai.
        </p>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <iframe
            src="https://digitalsherpa.ai/terms-of-service/"
            className="w-full"
            style={{ height: "80vh", border: "none" }}
            title="DigitalSherpa Terms of Service"
          />
        </div>

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
          View directly at{" "}
          <a href="https://digitalsherpa.ai/terms-of-service/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
            digitalsherpa.ai/terms-of-service
          </a>
        </p>
      </div>
    </div>
  )
}

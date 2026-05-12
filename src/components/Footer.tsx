"use client"

import Link from "next/link"
import Image from "next/image"
import { usePlatform } from "./PlatformProvider"

export default function Footer() {
  const platform = usePlatform()

  const privacyHref = platform.privacyPolicyUrl || "/privacy"
  const termsHref = platform.termsUrl || "/terms"

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {platform.logoUrl ? (
              <Image src={platform.logoUrl} alt={platform.platformName} width={28} height={28} className="object-contain" />
            ) : (
              <Image src="/logo.png" alt={platform.platformName} width={28} height={28} className="object-contain" />
            )}
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {platform.platformName}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href={privacyHref} className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href={termsHref} className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Terms of Service
            </Link>
            <a href="https://digitalsherpa.ai" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              DigitalSherpa.ai
            </a>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} DigitalSherpa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

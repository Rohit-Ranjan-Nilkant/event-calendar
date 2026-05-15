import { getSession } from "@/lib/session"
import FileUpload from "@/components/FileUpload"
import UrlCrawler from "@/components/UrlCrawler"

export default async function AdminUploadPage() {
  const session = await getSession()
  const isSuperAdmin = session?.role === "SUPER_ADMIN"

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fetch Data</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add events in bulk from files or web pages</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <FileUpload />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800" /></div>
        <div className="relative flex justify-center"><span className="bg-gray-50 dark:bg-gray-950 px-4 text-sm text-gray-500">or</span></div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <UrlCrawler isSuperAdmin={isSuperAdmin} />
      </div>
    </div>
  )
}

import Header from "@/components/Header"
import Footer from "@/components/Footer"

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {children}
      </main>
      <Footer />
    </div>
  )
}

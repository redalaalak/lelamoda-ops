import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-56 min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 pt-14">
          {children}
        </main>
      </div>
    </div>
  )
}

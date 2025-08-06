import Header from "./components/shared/Header";
import PostForm from "./components/shared/PostForm";
import PostsFeed from "./components/shared/PostsFeed";
import RecentUsers from "./components/shared/RecentUsers";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#531db5]/10 via-gray-900/30 to-[#8733ff]/10">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-9 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-3 order-1">
            <div className="sticky top-24">
              <RecentUsers />
            </div>
          </aside>
          {/* Main Content */}
          <main className="lg:col-span-6">
            <PostForm />
            <div className="mt-8">
              <PostsFeed />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

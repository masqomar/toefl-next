import { auth } from "@/auth";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <h1 className="text-xl font-bold text-blue-600">TOEFL ITP Platform</h1>
            </div>
            <nav className="flex items-center gap-3">
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/exams"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Exam
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
            TOEFL ITP
            <span className="block text-blue-600 mt-2">Computer-Based Test</span>
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            Platform profesional untuk mengerjakan soal TOEFL ITP secara online dengan fitur lengkap dan hasil yang akurat
          </p>
          <div className="mt-10 flex justify-center gap-4">
            {session ? (
              <Link
                href="/dashboard/exams"
                className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
              >
                Start Practice
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-blue-50 transition-all border-2 border-blue-200"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Test Sections
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
              <CardContent className="pt-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100 flex items-center justify-center text-3xl mb-4">
                  🎧
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Listening Comprehension</h4>
                <p className="text-gray-600 mb-4">
                  Test kemampuan mendengarkan bahasa Inggris dalam berbagai konteks percakapan dan pidato akademis
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">40 Questions</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">30 Minutes</span>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-t-4 border-t-green-500">
              <CardContent className="pt-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 flex items-center justify-center text-3xl mb-4">
                  📐
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Structure & Written Expression</h4>
                <p className="text-gray-600 mb-4">
                  Evaluasi pemahaman tata bahasa dan struktur kalimat dalam bahasa Inggris written
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">25 Questions</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">25 Minutes</span>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-t-4 border-t-purple-500">
              <CardContent className="pt-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-100 flex items-center justify-center text-3xl mb-4">
                  📚
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Reading Comprehension</h4>
                <p className="text-gray-600 mb-4">
                  Ukur kemampuan memahami dan menganalisis bacaan dalam bahasa Inggris akademis
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">40 Questions</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">55 Minutes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <p className="text-4xl sm:text-5xl font-bold">105</p>
              <p className="mt-2 text-blue-200">Questions</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-bold">110</p>
              <p className="mt-2 text-blue-200">Minutes</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-bold">310</p>
              <p className="mt-2 text-blue-200">Max Score</p>
            </div>
            <div>
              <p className="text-4xl sm:text-5xl font-bold">3</p>
              <p className="mt-2 text-blue-200">Sections</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Siap Mengukur Kemampuan Bahasa Inggrismu?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Daftar sekarang dan mulai latihan TOEFL ITP secara gratis
          </p>
          {!session && (
            <Link
              href="/register"
              className="inline-block px-10 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
            >
              Create Free Account
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <span className="text-xl font-bold text-white">TOEFL ITP Platform</span>
            </div>
            <p className="text-sm">
              © {new Date().getFullYear()} TOEFL ITP Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            HeroStudy AI
          </h1>
          <p className="text-xl mb-8 text-gray-300">
            Az intelligens tanulás jövője itt van
          </p>
          <div className="space-x-4">
            <Link
              href="/auth/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Kezdj most
            </Link>
            <Link
              href="/about"
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Tudj többet
            </Link>
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4">AI Támogatott Tanulás</h3>
            <p className="text-gray-400">
              Személyre szabott tanulási útvonalak és intelligens ajánlások
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4">Interaktív Tartalom</h3>
            <p className="text-gray-400">
              Videók, kvízek és szimulációk a hatékony tanuláshoz
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4">Analitika</h3>
            <p className="text-gray-400">
              Részletes visszajelzés a tanulási folyamatodról
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

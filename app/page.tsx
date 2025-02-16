import ImageUploader from "./components/ImageUploader"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24 relative z-10">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gray-800">Lung Cancer Classification</h1>
        <div className="bg-white bg-opacity-80 p-6 rounded-lg shadow-lg">
          <ImageUploader />
        </div>
      </div>
    </main>
  )
}


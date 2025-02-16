"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

type ClassificationResult = {
  fileName: string
  predictedName: string
  confidenceScore: number
  predictedImageUrl: string
  gradcamImageUrl: string
}

export default function ImageUploader() {
  const [images, setImages] = useState<File[]>([])
  const [results, setResults] = useState<ClassificationResult[]>([])
  const [isClassifying, setIsClassifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const classifyImage = useCallback(async (image: File) => {
    const formData = new FormData()
    formData.append("image", image)

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Classification failed")
      }

      const data = await response.json()
      return {
        fileName: image.name,
        predictedName: data.predictedName,
        confidenceScore: data.confidenceScore,
        predictedImageUrl: data.predictedImageUrl,
        gradcamImageUrl: data.gradcamImageUrl,
      }
    } catch (error) {
      console.error("Error classifying image:", error)
      return {
        fileName: image.name,
        predictedName: "Classification failed",
        confidenceScore: 0,
        predictedImageUrl: "",
        gradcamImageUrl: "",
      }
    }
  }, [])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsClassifying(true)
      setError(null)
      try {
        const newResults = await Promise.all(acceptedFiles.map(classifyImage))
        setImages((prevImages) => [...prevImages, ...acceptedFiles])
        setResults((prevResults) => [...prevResults, ...newResults])
      } catch (error) {
        setError("An error occurred while classifying images. Please try again.")
      } finally {
        setIsClassifying(false)
      }
    },
    [classifyImage],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] } })

  return (
    <div className="space-y-8 bg-white bg-opacity-90 p-6 rounded-lg shadow-lg">
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500">Drop the images here ...</p>
        ) : (
          <p className="text-gray-600">Drag 'n' drop some images here, or click to select images</p>
        )}
      </div>

      {isClassifying && (
        <div className="text-center">
          <p className="text-blue-500">Classifying images...</p>
        </div>
      )}

      {error && (
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Classification Results:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((result, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-700 truncate">{result.fileName}</h3>
                  <div className="mt-2 space-y-2">
                    <Image
                      src={result.predictedImageUrl || "/placeholder.svg"}
                      alt={`Predicted image ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full object-cover rounded-md"
                    />
                    <Image
                      src={result.gradcamImageUrl || "/placeholder.svg"}
                      alt={`Grad-CAM image ${index + 1}`}
                      width={200}
                      height={200}
                      className="w-full object-cover rounded-md"
                    />
                    <p
                      className={`font-semibold ${result.predictedName === "Benign" ? "text-green-500" : "text-red-500"}`}
                    >
                      {result.predictedName}
                    </p>
                    <p className="text-gray-600">Confidence: {(result.confidenceScore * 100).toFixed(2)}%</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


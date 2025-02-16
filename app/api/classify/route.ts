import { type NextRequest, NextResponse } from "next/server"
import * as tf from "@tensorflow/tfjs-node"
import sharp from "sharp"
import path from "path"
import fs from "fs"

let model: tf.GraphModel

async function loadModel() {
  const modelPath = "http://localhost:3000/tfjs_model/model.json"
  model = await tf.loadGraphModel(modelPath)
}

loadModel()

export async function POST(req: NextRequest) {
  if (!model) {
    return NextResponse.json({ error: "Model not loaded" }, { status: 500 })
  }

  const formData = await req.formData()
  const image = formData.get("image") as File

  if (!image) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 })
  }

  try {
    const buffer = await image.arrayBuffer()
    const tensor = tf.node.decodeImage(new Uint8Array(buffer))
    const resized = tf.image.resizeBilinear(tensor as tf.Tensor3D, [224, 224]) // Adjust size as needed
    const expanded = resized.expandDims(0)
    const normalized = expanded.div(255.0)

    const prediction = (await model.predict(normalized)) as tf.Tensor
    const [predictedClass, confidenceScore, gradcamImage] = await Promise.all([
      prediction.slice([0, 0], [1, 1]).data(),
      prediction.slice([0, 1], [1, 1]).data(),
      prediction.slice([0, 2], [-1, -1]).squeeze().mul(255).toInt().data(),
    ])

    // Convert predicted class to name
    const classNames = ["Benign", "Malignant"] // Adjust based on your model's classes
    const predictedName = classNames[Math.round(predictedClass[0])]

    // Generate the predicted image with name overlay
    const originalImage = sharp(buffer).resize(224, 224)
    const predictedImage = await originalImage
      .composite([
        {
          input: Buffer.from(
            `<svg><text x="10" y="20" font-family="Arial" font-size="16" fill="white">${predictedName}</text></svg>`,
          ),
          top: 0,
          left: 0,
        },
      ])
      .toBuffer()

    // Generate the Grad-CAM image
    const gradcamBuffer = Buffer.from(gradcamImage)
    const gradcamSharp = sharp(gradcamBuffer, { raw: { width: 224, height: 224, channels: 1 } })
      .resize(224, 224)
      .raw()
      .toBuffer()

    // Save images to public directory
    const publicDir = path.join(process.cwd(), "public")
    const predictedImagePath = path.join(publicDir, "predicted_image.png")
    const gradcamImagePath = path.join(publicDir, "gradcam_image.png")

    await fs.promises.writeFile(predictedImagePath, predictedImage)
    await fs.promises.writeFile(gradcamImagePath, await gradcamSharp)

    return NextResponse.json({
      predictedName,
      confidenceScore: confidenceScore[0],
      predictedImageUrl: "/predicted_image.png",
      gradcamImageUrl: "/gradcam_image.png",
    })
  } catch (error) {
    console.error("Classification error:", error)
    return NextResponse.json({ error: "Classification failed" }, { status: 500 })
  }
}


import fs from "fs";
import openai from "../config/ai.js";

const generateImageAnswer = async ({ file, category }) => {
  if (!file) {
    throw new Error("Image file is required.");
  }

  const categoryName = category?.name || "General Knowledge";

  const imageBuffer = fs.readFileSync(file.path);

  const base64Image = imageBuffer.toString("base64");

  const mimeType = file.mimetype;

  const response = await openai.responses.create({
    model: "gpt-5.6-luna",

    instructions: `
You are the AI assistant for "Ask Me Something".

The user selected the topic:
${categoryName}

Analyze the uploaded image carefully.

The image may contain:
- A homework question
- Mathematics
- Science
- A diagram
- Text
- A screenshot
- General knowledge
- Another question

Read the relevant information from the image and answer
the question clearly and accurately.

Guidelines:
- Explain the answer clearly.
- Use simple language where possible.
- For mathematics, show calculations step by step.
- For science, explain the underlying concept.
- If the image is unclear, say what cannot be read.
- Do not invent information that cannot be seen.
- For religious questions, respond respectfully.
- For medical, legal, or financial topics, provide general
  information and recommend a qualified professional for
  important decisions.
`,

    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Analyze this image and answer the question shown in it.",
          },
          {
            type: "input_image",
            image_url: `data:${mimeType};base64,${base64Image}`,
          },
        ],
      },
    ],
  });

  return response.output_text;
};

export default generateImageAnswer;

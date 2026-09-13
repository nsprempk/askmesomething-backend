import fs from "fs";
import openai from "../config/ai.js";

const transcribeAudio = async (file) => {
  if (!file) {
    throw new Error("Audio file is required.");
  }

  if (!file.path) {
    throw new Error("Audio file path is missing.");
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(file.path),
      model: "gpt-4o-mini-transcribe",
    });

    if (!transcription?.text?.trim()) {
      throw new Error("Unable to understand the audio recording.");
    }

    return transcription.text.trim();
  } finally {
    // Delete uploaded audio after transcription
    // to avoid keeping unnecessary user recordings.
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (deleteError) {
      console.error("Unable to delete audio file:", deleteError);
    }
  }
};

export default transcribeAudio;

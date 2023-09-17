import { FastifyInstance } from "fastify";
import { createReadStream } from "fs";
import { z } from 'zod';
import { openai } from '../lib/openai';
import { prisma } from "../lib/prisma";

export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post('/videos/:videoID/transcription', async (req) => {
    const paramsSchema = z.object({
      videoID: z.string().uuid()
    })

    const { videoID } = paramsSchema.parse(req.params)

    const bodySchema = z.object({
      prompt: z.string()
    })

    const { prompt } = bodySchema.parse(req.body)

    const video = await prisma.video.findFirstOrThrow({
      where: {
        id: videoID
      }
    })

    const videoPath = video.path
    const audioReadStream = createReadStream(videoPath)

    const response = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'json',
      temperature: 0,
      prompt,
    })

    const transcription = response.text

    await prisma.video.update({
      where: {
        id: videoID,
      },
      data: {
        transcription: transcription
      }
    })

    return {
      transcription
    }
  })
}
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('audio') as File;

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: 'OpenAI API Key not configured' }, { status: 500 });
        }

        if (!file) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        // 1. Transcribe with Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
        });

        const transcribedText = transcription.text;

        // 2. Process with GPT-4o
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: "Você é um assistente especialista em documentação psicológica. Sua tarefa é receber um relato falado e informal de uma sessão de terapia e reescrevê-lo como uma Evolução de Prontuário formal.\n\nRegras:\n\nSubstitua gírias por termos técnicos (ex: 'ele tava muito nervoso' -> 'paciente apresentou agitação psicomotora e ansiedade').\n\nMantenha a terceira pessoa ('O paciente relatou...').\n\nOrganize em um parágrafo coeso.\n\nImportante: Se houver nomes de terceiros (mãe, amigo), substitua por parentesco ou iniciais para privacidade."
                },
                {
                    role: 'user',
                    content: transcribedText
                }
            ],
        });

        const clinicalRecord = completion.choices[0].message.content;

        return NextResponse.json({
            transcription: transcribedText,
            clinicalRecord: clinicalRecord
        });

    } catch (error) {
        console.error('Error processing audio:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, FileText, Play, Trash2, Loader2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

export function Recorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [clinicalRecord, setClinicalRecord] = useState<string>("");
    const [isCopied, setIsCopied] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setSeconds((s) => s + 1);
            }, 1000);
        } else {
            setSeconds(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Cleanup URL on unmount
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setAudioUrl(null); // Clear previous recording
            setAudioBlob(null);
            setClinicalRecord("");
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Erro ao acessar o microfone. Verifique as permissões.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleToggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleGenerateRecord = async () => {
        if (!audioBlob) return;

        setIsProcessing(true);
        try {
            const formData = new FormData();
            // Append file with a filename so server can detect it properly if needed
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/process-audio', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to process audio');
            }

            const data = await response.json();
            setClinicalRecord(data.clinicalRecord);
        } catch (error) {
            console.error("Error generating record:", error);
            alert("Erro ao gerar prontuário. Tente novamente.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = async () => {
        if (!clinicalRecord) return;
        try {
            await navigator.clipboard.writeText(clinicalRecord);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text:", err);
        }
    };

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md mx-auto">
            {/* Timer Display */}
            <div className={cn(
                "text-6xl font-mono font-light tracking-wider text-primary transition-all duration-500",
                isRecording ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 h-0 overflow-hidden"
            )}>
                {formatTime(seconds)}
            </div>

            {/* Recording Button */}
            <div className="relative group">
                {/* Pulse effect ring */}
                <div className={cn(
                    "absolute inset-0 rounded-full bg-primary/20 blur-xl transition-all duration-1000",
                    isRecording ? "scale-150 opacity-100 animate-pulse" : "scale-100 opacity-0"
                )} />

                <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                        "relative h-40 w-40 rounded-full border-4 transition-all duration-500 shadow-2xl hover:scale-105 hover:shadow-primary/20 z-10",
                        isRecording
                            ? "border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:border-red-500"
                            : "border-primary/30 bg-background text-primary hover:border-primary hover:bg-primary/5"
                    )}
                    onClick={handleToggleRecording}
                    disabled={isProcessing}
                >
                    {isRecording ? (
                        <Square className="h-16 w-16 fill-current" />
                    ) : (
                        <Mic className="h-16 w-16" />
                    )}
                </Button>
            </div>

            {/* Status Text */}
            {!audioUrl && (
                <p className="text-muted-foreground text-lg font-medium animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {isRecording ? "Gravando..." : "Toque para gravar"}
                </p>
            )}

            {/* Audio Player & Actions */}
            {audioUrl && !isRecording && (
                <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 bg-card/50 p-6 rounded-2xl border border-border/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Gravação Concluída</h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                            onClick={() => {
                                setAudioUrl(null);
                                setAudioBlob(null);
                                setClinicalRecord("");
                            }}
                            disabled={isProcessing}
                        >
                            <Trash2 className="h-4 w-4 mr-1" /> Descartar
                        </Button>
                    </div>

                    <audio controls src={audioUrl} className="w-full h-10 accent-primary" />

                    {!clinicalRecord && (
                        <Button
                            className="w-full mt-2 h-12 text-lg font-medium shadow-lg shadow-primary/20"
                            onClick={handleGenerateRecord}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <FileText className="mr-2 h-5 w-5" />
                                    Gerar Prontuário
                                </>
                            )}
                        </Button>
                    )}

                    {clinicalRecord && (
                        <div className="mt-4 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-primary">Prontuário Gerado</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                    onClick={handleCopy}
                                >
                                    {isCopied ? (
                                        <>
                                            <Check className="h-4 w-4 mr-1 text-green-500" />
                                            <span className="text-green-500">Copiado!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4 mr-1" />
                                            Copiar
                                        </>
                                    )}
                                </Button>
                            </div>
                            <Textarea
                                value={clinicalRecord}
                                onChange={(e) => setClinicalRecord(e.target.value)}
                                className="min-h-[200px] bg-background/50 text-base leading-relaxed"
                            />
                            <p className="mt-2 text-xs text-muted-foreground text-center">
                                O profissional é responsável pela revisão final do conteúdo.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

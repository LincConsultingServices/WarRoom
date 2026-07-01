'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from '@/hooks/use-toast'

// A recording shorter/smaller than this carries no real speech; the transcription
// model fills the gap with hallucinated filler. Reject such clips at the source.
const MIN_RECORDING_MS = 1200
const MIN_RECORDING_BYTES = 1500

interface UseAudioRecorderReturn {
    isRecording: boolean
    isStarting: boolean
    audioBlob: Blob | null
    recordingTime: number
    maxDuration: number
    isSupported: boolean
    error: string | null
    startRecording: () => Promise<void>
    stopRecording: () => void
    resetRecording: () => void
}

export function useAudioRecorder(maxDurationSec: number = 60): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false)
    const [isStarting, setIsStarting] = useState(false)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [recordingTime, setRecordingTime] = useState(0)
    const [isSupported, setIsSupported] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const recordStartRef = useRef<number>(0)

    useEffect(() => {
        // Check if MediaRecorder is supported
        if (typeof window !== 'undefined') {
            setIsSupported(
                !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' && typeof window.MediaRecorder !== 'undefined')
            )
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const startRecording = useCallback(async () => {
        if (isStarting || isRecording) return
        setIsStarting(true)
        try {
            chunksRef.current = []
            setAudioBlob(null)
            setRecordingTime(0)
            setError(null)

            // Stop any existing stream before requesting a new one
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                }
            })
            streamRef.current = stream

            // Prefer webm/opus, fallback to webm, then any available
            let mimeType = 'audio/webm;codecs=opus'
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm'
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = '' // Let browser pick default
                }
            }

            const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
            mediaRecorderRef.current = mediaRecorder

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error)
                setIsRecording(false)
                setError(event.error || 'Recording failed')
                
                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop())
                    streamRef.current = null
                }

                // Clear timer
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' })
                const durationMs = recordStartRef.current ? Date.now() - recordStartRef.current : 0
                // Reject near-empty clips (quick start+stop) so nothing downstream
                // can submit a recording the model would only hallucinate over.
                if (durationMs < MIN_RECORDING_MS || blob.size < MIN_RECORDING_BYTES) {
                    setAudioBlob(null)
                    setError('Recording too short — hold and speak for at least a second, then stop.')
                } else {
                    setAudioBlob(blob)
                }
                setIsRecording(false)

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop())
                    streamRef.current = null
                }

                // Clear timer
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }
            }

            recordStartRef.current = Date.now()
            mediaRecorder.start() // Do not pass timeSlice to avoid instant termination issues
            setIsRecording(true)
            setIsStarting(false)

            // Start countdown timer
            const startTime = Date.now()
            timerRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000)
                setRecordingTime(elapsed)

                // Auto-stop when max duration reached
                if (elapsed >= maxDurationSec) {
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                        mediaRecorderRef.current.stop()
                    }
                }
            }, 100)
        } catch (err) {
            let errorMessage = 'Failed to start recording'
            let toastTitle = 'Microphone unavailable'
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings and try again.'
                    toastTitle = 'Microphone access denied'
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    errorMessage = 'No microphone found. Please connect a microphone and try again.'
                    toastTitle = 'No microphone found'
                } else if (err.name === 'NotReadableError') {
                    errorMessage = 'Microphone is in use by another application. Please close other apps using the mic and try again.'
                    toastTitle = 'Microphone in use'
                } else {
                    errorMessage = err.message
                }
            }
            console.error('Failed to start recording:', err)
            setError(errorMessage)
            setIsRecording(false)
            setIsStarting(false)
            toast({ variant: 'destructive', title: toastTitle, description: errorMessage })
        }
    }, [maxDurationSec, isStarting, isRecording])

    // Force-clear all recording-related side effects (timer, stream, mic LED, refs).
    // Idempotent and safe to call from any state. Separates teardown logic from
    // stopRecording/resetRecording so both can use it.
    const teardown = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try { mediaRecorderRef.current.stop() } catch { /* already stopping */ }
        }
        setIsRecording(false)
        setIsStarting(false)
    }, [])

    const stopRecording = useCallback(() => {
        const target = mediaRecorderRef.current
        if (!target || target.state !== 'recording') return
        target.stop()
        // Defensive: if `onstop` never fires for THIS recorder, force teardown
        // after 2s. We bind to a specific MediaRecorder reference so that a
        // brand-new recording started in the interim is NOT affected.
        window.setTimeout(() => {
            if (mediaRecorderRef.current === target && target.state !== 'inactive') {
                setIsRecording(false)
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }
            }
        }, 2000)
    }, [])

    const resetRecording = useCallback(() => {
        teardown()
        setAudioBlob(null)
        setRecordingTime(0)
        setError(null)
        chunksRef.current = []
    }, [teardown])

    return {
        isRecording,
        isStarting,
        audioBlob,
        recordingTime,
        maxDuration: maxDurationSec,
        isSupported,
        error,
        startRecording,
        stopRecording,
        resetRecording,
    }
}

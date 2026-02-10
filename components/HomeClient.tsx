'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiChevronDown, FiChevronUp, FiUser, FiCalendar, FiHome, FiHash, FiMessageSquare, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// ---- Constants ----

const AGENT_ID = '698a2ce42cb03d3e1f995f02';
const AGENT_NAME = 'Hotel Concierge Agent';
const LYZR_VOICE_WS = 'wss://voice-prod.studio.lyzr.ai';

const THEME_VARS = {
  '--background': '35 29% 95%',
  '--foreground': '30 22% 14%',
  '--card': '35 29% 92%',
  '--card-foreground': '30 22% 14%',
  '--popover': '35 29% 90%',
  '--popover-foreground': '30 22% 14%',
  '--primary': '27 61% 26%',
  '--primary-foreground': '35 29% 98%',
  '--secondary': '35 20% 88%',
  '--secondary-foreground': '30 22% 18%',
  '--accent': '43 75% 38%',
  '--accent-foreground': '35 29% 98%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 98%',
  '--muted': '35 15% 85%',
  '--muted-foreground': '30 20% 45%',
  '--border': '27 61% 26%',
  '--input': '35 15% 75%',
  '--ring': '27 61% 26%',
  '--radius': '0.5rem',
} as React.CSSProperties;

// ---- Types ----

type CallStatus = 'idle' | 'connecting' | 'active' | 'ending';

interface TranscriptEntry {
  id: string;
  speaker: 'guest' | 'concierge';
  text: string;
  timestamp: string;
}

interface BookingSummary {
  guestName: string;
  contactNumber: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  specialRequests: string;
  confirmationNumber: string;
}

// ---- Helpers ----

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getTimestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---- Sample Data ----

const SAMPLE_TRANSCRIPT: TranscriptEntry[] = [
  { id: '1', speaker: 'concierge', text: 'Welcome to Grand Heritage Hotel. I am your personal concierge. How may I assist you today?', timestamp: '10:00 AM' },
  { id: '2', speaker: 'guest', text: 'Hello, I would like to book a room for two nights starting this Friday.', timestamp: '10:00 AM' },
  { id: '3', speaker: 'concierge', text: 'Wonderful! I would be happy to help you with that. Could I have your full name, please?', timestamp: '10:01 AM' },
  { id: '4', speaker: 'guest', text: 'My name is Victoria Ashworth.', timestamp: '10:01 AM' },
  { id: '5', speaker: 'concierge', text: 'Thank you, Ms. Ashworth. For a two-night stay beginning this Friday, I can offer our Deluxe King Suite with a garden view. Would that be suitable?', timestamp: '10:01 AM' },
  { id: '6', speaker: 'guest', text: 'That sounds lovely. Yes, please proceed with the Deluxe King Suite.', timestamp: '10:02 AM' },
  { id: '7', speaker: 'concierge', text: 'Excellent choice. Your reservation is confirmed. Confirmation number GH-2024-8847. Is there anything else I can arrange for you?', timestamp: '10:02 AM' },
];

const SAMPLE_BOOKING: BookingSummary = {
  guestName: 'Victoria Ashworth',
  contactNumber: '+1 (555) 234-8901',
  checkIn: 'Friday, March 14, 2025',
  checkOut: 'Sunday, March 16, 2025',
  roomType: 'Deluxe King Suite - Garden View',
  specialRequests: 'Late check-in, extra pillows, champagne upon arrival',
  confirmationNumber: 'GH-2024-8847',
};

// ---- Sub-Components ----

function VoiceOrb({ status }: { status: CallStatus }) {
  const baseClasses = 'relative w-40 h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center mx-auto';

  const orbContent = (
    <div className={baseClasses}>
      {/* Outer ring animations */}
      {status === 'connecting' && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
          <div className="absolute inset-[-8px] rounded-full border border-primary/20 animate-ping" style={{ animationDelay: '300ms', animationDuration: '1.5s' }} />
        </>
      )}
      {status === 'active' && (
        <>
          <div className="absolute inset-[-12px] rounded-full border border-accent/30 animate-pulse" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-[-24px] rounded-full border border-accent/15 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '200ms' }} />
          <div className="absolute inset-[-36px] rounded-full border border-accent/10 animate-pulse" style={{ animationDuration: '3s', animationDelay: '400ms' }} />
        </>
      )}
      {status === 'ending' && (
        <div className="absolute inset-0 rounded-full border border-muted-foreground/30 animate-pulse" style={{ animationDuration: '3s' }} />
      )}

      {/* Core orb */}
      <div
        className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center transition-all duration-700 ${
          status === 'idle'
            ? 'bg-gradient-to-br from-secondary to-muted shadow-lg'
            : status === 'connecting'
              ? 'bg-gradient-to-br from-primary/80 to-primary shadow-xl shadow-primary/20 animate-pulse'
              : status === 'active'
                ? 'bg-gradient-to-br from-accent/90 to-accent shadow-2xl shadow-accent/30'
                : 'bg-gradient-to-br from-muted to-secondary shadow-md animate-pulse'
        }`}
        style={status === 'active' ? { animationDuration: '1.5s' } : undefined}
      >
        {/* Inner highlight */}
        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-700 ${
          status === 'idle'
            ? 'bg-secondary/60'
            : status === 'connecting'
              ? 'bg-primary-foreground/10'
              : status === 'active'
                ? 'bg-accent-foreground/10 animate-pulse'
                : 'bg-muted/40'
        }`}>
          {status === 'idle' && <FiPhone className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />}
          {status === 'connecting' && <FiPhone className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground animate-bounce" />}
          {status === 'active' && (
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-accent-foreground rounded-full animate-pulse"
                  style={{
                    height: `${12 + (i % 3) * 8}px`,
                    animationDelay: `${i * 150}ms`,
                    animationDuration: '0.8s',
                  }}
                />
              ))}
            </div>
          )}
          {status === 'ending' && <FiPhoneOff className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />}
        </div>
      </div>
    </div>
  );

  return orbContent;
}

function StatusLabel({ status }: { status: CallStatus }) {
  const labels: Record<CallStatus, string> = {
    idle: 'Ready to Connect',
    connecting: 'Connecting to Concierge...',
    active: 'Call in Progress',
    ending: 'Call Ending...',
  };

  return (
    <p className={`text-center mt-4 text-sm font-medium tracking-wide transition-all duration-300 ${
      status === 'active' ? 'text-accent' : 'text-muted-foreground'
    }`}>
      {labels[status]}
    </p>
  );
}

function TranscriptMessage({ entry }: { entry: TranscriptEntry }) {
  const isGuest = entry.speaker === 'guest';
  return (
    <div className={`flex gap-3 mb-4 ${isGuest ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isGuest ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
      }`}>
        {isGuest ? <FiUser className="w-4 h-4" /> : <FiHome className="w-4 h-4" />}
      </div>
      <div className={`max-w-[75%] ${isGuest ? 'text-right' : 'text-left'}`}>
        <p className="text-xs text-muted-foreground mb-1 font-sans">
          {isGuest ? 'Guest' : 'Concierge'} -- {entry.timestamp}
        </p>
        <div className={`inline-block px-4 py-2.5 rounded-lg text-sm leading-relaxed ${
          isGuest
            ? 'bg-primary text-primary-foreground rounded-tr-none'
            : 'bg-card text-card-foreground border border-border/30 rounded-tl-none'
        }`}>
          {entry.text}
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: BookingSummary }) {
  const fields = [
    { icon: <FiUser className="w-4 h-4" />, label: 'Guest Name', value: booking.guestName },
    { icon: <FiPhone className="w-4 h-4" />, label: 'Contact', value: booking.contactNumber },
    { icon: <FiCalendar className="w-4 h-4" />, label: 'Check-in', value: booking.checkIn },
    { icon: <FiCalendar className="w-4 h-4" />, label: 'Check-out', value: booking.checkOut },
    { icon: <FiHome className="w-4 h-4" />, label: 'Room Type', value: booking.roomType },
    { icon: <FiMessageSquare className="w-4 h-4" />, label: 'Special Requests', value: booking.specialRequests },
    { icon: <FiHash className="w-4 h-4" />, label: 'Confirmation', value: booking.confirmationNumber },
  ];

  return (
    <Card className="border-border/40 shadow-xl bg-card mt-6 overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="text-xl font-semibold text-foreground tracking-tight">Booking Confirmation</CardTitle>
        <CardDescription className="text-muted-foreground text-sm">Your reservation details are below</CardDescription>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">
        {fields.map((field, idx) => (
          <div key={idx}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center flex-shrink-0 text-primary mt-0.5">
                {field.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider">{field.label}</p>
                <p className="text-sm text-foreground font-medium mt-0.5">{field.value || '--'}</p>
              </div>
            </div>
            {idx < fields.length - 1 && <Separator className="mt-3 bg-border/20" />}
          </div>
        ))}
      </CardContent>
      <CardFooter className="bg-primary/5 pt-4">
        <p className="text-xs text-muted-foreground text-center w-full">Thank you for choosing Grand Heritage Hotel</p>
      </CardFooter>
    </Card>
  );
}

function AgentInfoCard({ status }: { status: CallStatus }) {
  return (
    <Card className="border-border/30 shadow-md bg-card/80 mt-6">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          <FiInfo className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-sans text-muted-foreground uppercase tracking-wider">Powered by</p>
            <p className="text-sm font-medium text-foreground truncate">{AGENT_NAME}</p>
          </div>
          <Badge variant={status === 'active' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
            {status === 'active' ? 'Active' : status === 'connecting' ? 'Connecting' : 'Standby'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Main Component ----

export default function HomeClient() {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [showTranscript, setShowTranscript] = useState(true);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSampleData, setShowSampleData] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string>('');
  const sessionIdRef = useRef<string>('');
  const callStatusRef = useRef<CallStatus>('idle');
  const isEndingRef = useRef(false);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'active') {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callStatus]);

  // Keep callStatusRef in sync with callStatus state
  const updateCallStatus = useCallback((status: CallStatus) => {
    callStatusRef.current = status;
    setCallStatus(status);
  }, []);

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Cleanup helper for media resources
  const cleanupMedia = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
    }
    mediaRecorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const playAudioChunk = useCallback(async (audioData: ArrayBuffer) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      const audioBuffer = await ctx.decodeAudioData(audioData.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch {
      try {
        const blob = new Blob([audioData], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        await audio.play();
        audio.onended = () => URL.revokeObjectURL(url);
      } catch {
        // silently fail audio playback
      }
    }
  }, []);

  const startCall = useCallback(async () => {
    // Guard against double-start
    if (callStatusRef.current !== 'idle') return;

    setErrorMessage(null);
    updateCallStatus('connecting');
    setTranscript([]);
    setBookingSummary(null);
    setCallDuration(0);
    isEndingRef.current = false;

    // Generate session identifiers
    userIdRef.current = generateUUID();
    sessionIdRef.current = generateUUID();

    // Request microphone access
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch {
      setErrorMessage('Microphone access is required for voice calls. Please grant permission and try again.');
      updateCallStatus('idle');
      return;
    }

    // Initialize AudioContext
    try {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      // AudioContext will be created on first audio receipt
    }

    // Connect WebSocket
    const wsUrl = `${LYZR_VOICE_WS}?agent_id=${AGENT_ID}&user_id=${userIdRef.current}&session_id=${sessionIdRef.current}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      setErrorMessage('Unable to establish voice connection. Please try again.');
      cleanupMedia();
      updateCallStatus('idle');
      return;
    }

    wsRef.current = ws;
    ws.binaryType = 'arraybuffer';

    // Connection timeout - if not open within 15 seconds, fail gracefully
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        cleanupMedia();
        setErrorMessage('Connection timed out. Please check your network and try again.');
        updateCallStatus('idle');
      }
    }, 15000);

    ws.onopen = () => {
      clearTimeout(connectionTimeout);
      updateCallStatus('active');
      setErrorMessage(null);

      // Start MediaRecorder
      try {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/mp4';

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        mediaRecorder.start(250);
      } catch {
        setErrorMessage('Unable to start audio recording. Please try a different browser.');
        ws.close();
        cleanupMedia();
        updateCallStatus('idle');
      }
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        playAudioChunk(event.data);
      } else if (typeof event.data === 'string') {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed?.type === 'transcript' && parsed?.text) {
            const speaker = parsed.speaker === 'user' || parsed.speaker === 'guest' ? 'guest' : 'concierge';
            setTranscript((prev) => [
              ...prev,
              {
                id: generateUUID(),
                speaker,
                text: parsed.text,
                timestamp: getTimestamp(),
              },
            ]);
          } else if (parsed?.type === 'booking_summary' || parsed?.type === 'summary') {
            setBookingSummary({
              guestName: parsed?.guestName ?? parsed?.guest_name ?? '',
              contactNumber: parsed?.contactNumber ?? parsed?.contact_number ?? '',
              checkIn: parsed?.checkIn ?? parsed?.check_in ?? '',
              checkOut: parsed?.checkOut ?? parsed?.check_out ?? '',
              roomType: parsed?.roomType ?? parsed?.room_type ?? '',
              specialRequests: parsed?.specialRequests ?? parsed?.special_requests ?? '',
              confirmationNumber: parsed?.confirmationNumber ?? parsed?.confirmation_number ?? '',
            });
          } else if (parsed?.type === 'audio' && parsed?.audio) {
            try {
              const binaryStr = atob(parsed.audio);
              const bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              playAudioChunk(bytes.buffer);
            } catch {
              // ignore decode errors
            }
          } else if (parsed?.type === 'error') {
            setErrorMessage(parsed?.message ?? 'An error occurred during the call.');
          }
        } catch {
          // Non-JSON text message, treat as plain transcript from agent
          const text = event.data.trim();
          if (text.length > 0) {
            setTranscript((prev) => [
              ...prev,
              {
                id: generateUUID(),
                speaker: 'concierge',
                text,
                timestamp: getTimestamp(),
              },
            ]);
          }
        }
      }
    };

    ws.onerror = () => {
      clearTimeout(connectionTimeout);
      // Only show error if we haven't already initiated ending
      if (!isEndingRef.current) {
        setErrorMessage('Connection error. Please check your internet connection and try again.');
      }
      // Don't set idle here -- onclose always fires after onerror
    };

    ws.onclose = () => {
      clearTimeout(connectionTimeout);
      // Clean up media resources
      cleanupMedia();
      wsRef.current = null;

      // Only reset to idle if user didn't manually end (endCall handles its own transition)
      if (!isEndingRef.current && callStatusRef.current !== 'idle') {
        updateCallStatus('idle');
      }
    };
  }, [updateCallStatus, cleanupMedia, playAudioChunk]);

  const endCall = useCallback(() => {
    isEndingRef.current = true;
    updateCallStatus('ending');

    // Close WebSocket first (triggers onclose which cleans media)
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    // Also clean up media directly for immediate feedback
    cleanupMedia();

    setTimeout(() => {
      updateCallStatus('idle');
      isEndingRef.current = false;
    }, 1500);
  }, [updateCallStatus, cleanupMedia]);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Determine which data to display
  const displayTranscript = showSampleData ? SAMPLE_TRANSCRIPT : transcript;
  const displayBooking = showSampleData ? SAMPLE_BOOKING : bookingSummary;
  const displayStatus = showSampleData ? 'idle' as CallStatus : callStatus;

  return (
    <div style={THEME_VARS} className="min-h-screen bg-background text-foreground">
      {/* Decorative top bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
        {/* Sample Data Toggle */}
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground font-sans cursor-pointer">Sample Data</Label>
            <Switch
              id="sample-toggle"
              checked={showSampleData}
              onCheckedChange={setShowSampleData}
            />
          </div>
        </div>

        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-block mb-3">
            <div className="w-12 h-0.5 bg-accent mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground font-serif">Grand Heritage Hotel</h1>
            <div className="w-12 h-0.5 bg-accent mx-auto mt-4" />
          </div>
          <p className="text-muted-foreground text-sm tracking-widest uppercase font-sans mt-2">Your Personal Concierge</p>
        </header>

        {/* Voice Orb */}
        <section className="mb-8">
          <VoiceOrb status={showSampleData ? 'idle' : callStatus} />
          <StatusLabel status={showSampleData ? 'idle' : callStatus} />
          {callStatus === 'active' && !showSampleData && (
            <p className="text-center mt-2 text-xs text-muted-foreground font-mono tracking-wider">{formatDuration(callDuration)}</p>
          )}
        </section>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
            <FiAlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{errorMessage}</p>
          </div>
        )}

        {/* Call Controls */}
        <section className="flex items-center justify-center gap-4 mb-8">
          {callStatus === 'idle' || callStatus === 'ending' ? (
            <Button
              onClick={startCall}
              disabled={callStatus === 'ending' || showSampleData}
              className="px-8 py-6 text-base font-sans font-medium tracking-wide rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50"
            >
              <FiPhone className="w-5 h-5 mr-2" />
              Start Booking Call
            </Button>
          ) : (
            <>
              <Button
                onClick={endCall}
                variant="destructive"
                className="px-8 py-6 text-base font-sans font-medium tracking-wide rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <FiPhoneOff className="w-5 h-5 mr-2" />
                End Call
              </Button>
              <Button
                onClick={toggleMute}
                variant={isMuted ? 'destructive' : 'secondary'}
                className="px-4 py-6 rounded-lg shadow-md transition-all duration-300"
              >
                {isMuted ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
              </Button>
            </>
          )}
        </section>

        {/* Educational text when idle and no sample data */}
        {callStatus === 'idle' && !showSampleData && transcript.length === 0 && !bookingSummary && (
          <div className="text-center mb-8 px-4">
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
              Press &quot;Start Booking Call&quot; to connect with our voice concierge. Speak naturally to book rooms, request services, or inquire about amenities.
            </p>
          </div>
        )}

        {/* Transcript Panel */}
        {displayTranscript.length > 0 && (
          <section className="mb-6">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-card border border-border/30 shadow-sm hover:bg-card/80 transition-colors duration-200"
            >
              <div className="flex items-center gap-2">
                <FiMessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-sans font-medium text-foreground">
                  Conversation Transcript
                </span>
                <Badge variant="secondary" className="text-xs ml-1">{displayTranscript.length}</Badge>
              </div>
              {showTranscript ? (
                <FiChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <FiChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showTranscript && (
              <Card className="mt-2 border-border/30 shadow-md bg-card/60 overflow-hidden">
                <CardContent className="p-0">
                  <ScrollArea className="h-72 md:h-80">
                    <div className="p-4 space-y-1">
                      {displayTranscript.map((entry) => (
                        <TranscriptMessage key={entry.id} entry={entry} />
                      ))}
                      <div ref={transcriptEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </section>
        )}

        {/* Booking Summary */}
        {displayBooking && (
          <section className="mb-6">
            <BookingCard booking={displayBooking} />
          </section>
        )}

        {/* Agent Info */}
        <AgentInfoCard status={displayStatus} />

        {/* Footer */}
        <footer className="mt-8 text-center">
          <Separator className="mb-4 bg-border/20" />
          <p className="text-xs text-muted-foreground font-sans tracking-wider">
            Grand Heritage Hotel -- Excellence in Hospitality Since 1924
          </p>
        </footer>
      </div>
    </div>
  );
}

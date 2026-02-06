import {
  Download,
  Music,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldCheck,
  Activity,
  Headphones,
  Volume2,
  VolumeX,
  Play,
  X,
  Eye,
  Minus
} from 'lucide-react';
import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { useState, useEffect, useRef } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, converting, success, error
  const [error, setError] = useState('');
  const [downloadBlob, setDownloadBlob] = useState(null);
  const [resultFileName, setResultFileName] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSuccessMinimized, setIsSuccessMinimized] = useState(false);
  const [isConvertingMinimized, setIsConvertingMinimized] = useState(false);
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(25).fill(4));
  const [bgMusicTime, setBgMusicTime] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (status === 'converting') {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev + 0.1; // Slow down at the end
          if (prev >= 80) return prev + 0.5;
          return prev + 1;
        });
      }, 500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [status]);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const animationPropsRef = useRef(null);

  useEffect(() => {
    const initAudio = () => {
      if (!audioRef.current || analyserRef.current) return;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(audioRef.current);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128; // Increased for more detail
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        // Sample 25 points for that mega wide look
        const samples = [];
        for (let i = 0; i < 25; i++) {
          const index = Math.floor((i / 25) * (bufferLength * 0.7)); // Focus on audible range
          samples.push(Math.max(dataArray[index] / 255 * 50, 4));
        }

        setFrequencyData(samples);
        animationPropsRef.current = requestAnimationFrame(update);
      };

      update();
    };

    const playAttempt = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          initAudio();
          removeListeners();
        }).catch(() => { });
      }
    };

    const removeListeners = () => {
      window.removeEventListener('click', playAttempt);
      window.removeEventListener('touchstart', playAttempt);
      window.removeEventListener('keydown', playAttempt);
    };

    window.addEventListener('click', playAttempt);
    window.addEventListener('touchstart', playAttempt);
    window.addEventListener('keydown', playAttempt);

    return () => {
      removeListeners();
      if (animationPropsRef.current) cancelAnimationFrame(animationPropsRef.current);
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      setIsMuted(!isMuted);
    }
  };

  const startPreview = () => {
    if (audioRef.current && downloadBlob) {
      setBgMusicTime(audioRef.current.currentTime);
      audioRef.current.src = downloadBlob;
      audioRef.current.play();
      setIsPreviewing(true);
    }
  };

  const closePreview = () => {
    if (audioRef.current) {
      audioRef.current.src = "/Angela%20Chang%20%E2%80%A2%20%EF%BD%9C%20Confused%20%E2%80%A2%20%EF%BD%9C%20The%20Land%20Of%20Warriors%20OST%202024%20%E2%80%A2%20%EF%BD%9C%20%5B%20Traducida%20Al%20Espa%C3%B1ol%20%5D.mp3";
      audioRef.current.currentTime = bgMusicTime;
      if (!isMuted) audioRef.current.play();
      setIsPreviewing(false);
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!url) return;

    setStatus('converting');
    setError('');
    setDownloadBlob(null);
    setIsSuccessMinimized(false);
    setIsConvertingMinimized(false);

    try {
      // --- MIGRATION: Switch to Render Backend ---
      // const convertVideo = httpsCallable(functions, 'convertVideo', { timeout: 540000 });
      // const result = await convertVideo({ url });

      // Local Test URL (Run 'npm run dev' in backend-render folder)
      const BACKEND_URL = 'http://localhost:10000/convertVideo';
      // Production URL (After deploying to Render)
      // const BACKEND_URL = 'https://your-render-app-name.onrender.com/convertVideo';

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Conversion failed on server');
      }

      const data = await response.json();

      if (data.success) {
        const byteCharacters = atob(data.audioData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });

        const blobUrl = URL.createObjectURL(blob);
        setDownloadBlob(blobUrl);
        setResultFileName(data.fileName);
        setProgress(100);
        setTimeout(() => setStatus('success'), 500);
      } else {
        throw new Error('Conversion failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'The server heartbeat skipped. Try again.');
      setStatus('error');
    }
  };

  const handleDownload = () => {
    if (!downloadBlob) return;
    const link = document.createElement('a');
    link.href = downloadBlob;
    link.download = resultFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative h-screen min-h-[600px] overflow-y-auto sm:overflow-hidden selection:bg-blue-500/30">
      {/* Success Restore Toggle */}
      {status === 'success' && isSuccessMinimized && (
        <button
          onClick={() => setIsSuccessMinimized(false)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[100] p-4 bg-emerald-500/80 backdrop-blur-xl text-white rounded-r-2xl shadow-2xl hover:bg-emerald-400 hover:pl-6 transition-all animate-in slide-in-from-left duration-500 group"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block whitespace-nowrap">Show Result</span>
          </div>
        </button>
      )}

      {/* Converting Background Progress Indicator */}
      {status === 'converting' && isConvertingMinimized && (
        <button
          onClick={() => setIsConvertingMinimized(false)}
          className="fixed bottom-24 right-6 z-[110] p-4 bg-blue-600/80 backdrop-blur-xl text-white rounded-2xl shadow-2xl hover:bg-blue-500 transition-all animate-in slide-in-from-bottom duration-500 flex items-center gap-4 group"
        >
          <div className="relative flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="absolute text-[8px] font-bold">{Math.floor(progress)}%</span>
          </div>
          <div className="flex flex-col items-start leading-none pr-2">
            <span className="text-[10px] font-bold uppercase tracking-widest">Extracting...</span>
            <div className="w-16 h-1 bg-white/20 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-white transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </button>
      )}

      {/* Live Preview Overlay */}
      {isPreviewing && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <button
            onClick={closePreview}
            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="text-center space-y-8 w-full max-w-4xl">
            <div className="space-y-2">
              <h2 className="text-blue-500 font-bold tracking-widest uppercase text-sm">Now Playing • Sonic Pulse Master</h2>
              <p className="text-3xl sm:text-5xl font-black text-white tracking-tighter truncate px-4">{resultFileName}</p>
            </div>

            <div className="flex items-end justify-center gap-1 sm:gap-2 h-64 sm:h-96 py-12">
              {frequencyData.map((height, i) => (
                <div
                  key={i}
                  className="w-2 sm:w-4 bg-gradient-to-t from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-75"
                  style={{
                    height: `${height * 6}px`, // 6x taller for the huge overlay
                    opacity: 0.3 + (height / 50)
                  }}
                ></div>
              ))}
            </div>

            <div className="inline-flex items-center space-x-3 px-8 py-3 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1 h-3 bg-blue-500 animate-pulse" />
                ))}
              </div>
              <span className="text-blue-400 font-bold uppercase tracking-widest text-xs">High Fidelity Streaming Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Background Audio Engine */}
      <audio
        ref={audioRef}
        src="/Angela%20Chang%20%E2%80%A2%20%EF%BD%9C%20Confused%20%E2%80%A2%20%EF%BD%9C%20The%20Land%20Of%20Warriors%20OST%202024%20%E2%80%A2%20%EF%BD%9C%20%5B%20Traducida%20Al%20Espa%C3%B1ol%20%5D.mp3"
        loop
        autoPlay
      />

      {/* Floating Sound Control Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-6">
        {!isMuted && (
          <div className="flex items-end gap-[4px] h-10 pb-1">
            {frequencyData.map((height, i) => (
              <div
                key={i}
                className="w-[4px] bg-blue-400/80 rounded-full transition-all duration-75"
                style={{
                  height: `${height}px`,
                  backgroundColor: i % 2 === 0 ? '#60a5fa' : '#818cf8'
                }}
              ></div>
            ))}
          </div>
        )}

        <button
          onClick={toggleMute}
          className="p-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-blue-600 transition-all shadow-2xl group flex items-center justify-center"
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-slate-400 group-hover:text-white" />
          ) : (
            <Volume2 className="w-6 h-6 text-blue-400 group-hover:text-white" />
          )}
        </button>
      </div>

      {/* Cinematic Marquee Background */}
      <div className="fixed inset-0 z-[-2] flex flex-col justify-center gap-12 sm:gap-14 overflow-hidden select-none pointer-events-none">
        {/* Row 1: Right to Left (img-1 to img-4) */}
        <div className="flex animate-marquee-left whitespace-nowrap">
          <div className="cinematic-row">
            {[1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4].map((id, i) => (
              <img key={i} src={`/img-${id}.jpg`} alt="" className="cinematic-img" />
            ))}
          </div>
        </div>

        {/* Row 2: Left to Right (img-5 to img-8) */}
        <div className="flex animate-marquee-right whitespace-nowrap">
          <div className="cinematic-row">
            {[5, 6, 7, 8, 5, 6, 7, 8, 5, 6, 7, 8, 5, 6, 7, 8].map((id, i) => (
              <img key={i} src={`/img-${id}.jpg`} alt="" className="cinematic-img" />
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex flex-col h-full items-center z-10 p-4 sm:p-6">
        <header className="w-full max-w-2xl flex items-center justify-between mb-auto py-4">
          <div className="flex items-center space-x-2">
            <img src="/favicon.svg" alt="Sonic Pulse Logo" className="w-10 h-10" />
            <span className="font-bold text-xl tracking-tighter text-white uppercase italic">Sonic Pulse</span>
          </div>
          <div className="hidden sm:block text-[10px] font-mono tracking-[0.3em] text-slate-500 uppercase">
            Sonic Extraction v2.0
          </div>
        </header>

        <main className="w-full max-w-2xl space-y-6 sm:space-y-8 my-auto animate-in fade-in zoom-in duration-700">
          <section className="text-center space-y-3 sm:space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold uppercase tracking-widest">
              <Activity className="w-3 h-3" />
              <span>Engine Status: Optimal</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-blue-500 tracking-tight leading-none text-center">
              Sonic <br /> Perfection.
            </h1>
            <p className="text-slate-400 text-xs sm:text-base max-w-md mx-auto leading-relaxed px-4">
              The fastest 320kbps MP3 conversion engine ever built for the web.
            </p>
          </section>

          <div className="glass-card p-3 sm:p-2 bg-slate-900/40 border-white/5 overflow-hidden mx-2 sm:mx-0">
            <form onSubmit={handleConvert} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste URL (YouTube / URL...)"
                  required
                  className="block w-full pl-14 pr-4 py-6 bg-transparent rounded-[2rem] outline-none text-white text-lg placeholder:text-slate-600 focus:bg-white/5 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'converting'}
                className="btn-dope"
              >
                {status === 'converting' ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  "GO"
                )}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-2 sm:px-0">
            {[
              { icon: Headphones, label: '320kbps Studio Quality', color: 'text-blue-400' },
              { icon: ShieldCheck, label: 'No Data Logs', color: 'text-emerald-400' },
              { icon: Zap, label: 'Instant Cloud Sync', color: 'text-amber-400' }
            ].map((item, i) => (
              <div key={i} className="glass-card p-4 sm:p-6 flex flex-row sm:flex-col items-center gap-4 sm:gap-3 text-left sm:text-center border-white/5">
                <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.color}`} />
                <span className="text-xs font-medium text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4 px-2 sm:px-0">
            {status === 'converting' && !isConvertingMinimized && (
              <div className="fixed inset-0 z-[140] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
                <div className="relative space-y-6 glass-card p-8 sm:p-12 w-full max-w-lg border-blue-500/20 shadow-[0_0_100px_-20px_rgba(59,130,246,0.2)]">
                  <button
                    onClick={() => setIsConvertingMinimized(true)}
                    className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex flex-col">
                      <span className="text-blue-400 font-bold text-xs uppercase tracking-tighter">Analyzing Stream</span>
                      <span className="text-[32px] font-black text-white leading-none mt-1">{Math.floor(progress)}%</span>
                    </div>
                    <span className="text-slate-500 text-[10px] font-mono tracking-widest">320kbps_EXTRACT_MODE</span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-[2px]">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="pt-4 text-center">
                    <p className="text-blue-400/60 text-[10px] font-mono uppercase tracking-[0.2em] mb-2">Extracting High Bitrate Audio</p>
                    <p className="text-slate-200 text-sm font-medium italic">"Quality is not an act, it is a habit."</p>
                  </div>
                </div>
              </div>
            )}

            {status === 'success' && !isSuccessMinimized && (
              <div className="fixed inset-0 z-[150] bg-transparent backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
                <button
                  onClick={() => setIsSuccessMinimized(true)}
                  className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[160]"
                >
                  <X className="w-8 h-8" />
                </button>
                <div className="glass-card w-full max-w-lg p-8 sm:p-12 border-emerald-500/30 bg-slate-900/80 space-y-8 text-center shadow-[0_0_100px_-20px_rgba(16,185,129,0.3)]">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-emerald-500 p-4 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-emerald-500 font-black text-3xl sm:text-4xl italic uppercase tracking-tighter leading-none">MASTERED.</h3>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">320KBPS SONIC PRECISION</p>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mx-auto">
                    <p className="text-sm text-slate-400 font-medium truncate italic">{resultFileName}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={startPreview}
                        className="flex-1 py-5 bg-blue-600 text-white font-black text-lg rounded-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        <Play className="w-6 h-6 fill-current" />
                        PREVIEW
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex-1 py-5 bg-white text-black font-black text-lg rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.3)] active:scale-95"
                      >
                        <Download className="w-6 h-6" />
                        GET MP3
                      </button>
                    </div>

                    <button
                      onClick={() => setStatus('idle')}
                      className="w-full py-4 text-slate-500 font-bold hover:text-white transition-all text-xs uppercase tracking-widest border border-white/5 rounded-xl mt-2"
                    >
                      Convert Another
                    </button>
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="glass-card p-5 sm:p-6 border-red-500/20 bg-red-500/5 flex items-start gap-4 animate-in shake duration-500">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm text-red-400 font-bold uppercase tracking-tighter leading-none">Frequency Error</p>
                  <p className="text-xs text-slate-400">{error}</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-white text-[10px] font-bold underline underline-offset-4 tracking-widest"
                  >
                    RETRY SYSTEM
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="w-full max-w-2xl py-4 sm:py-6 text-center opacity-40">
          <p className="text-[9px] sm:text-[10px] font-mono tracking-[0.3em] sm:tracking-[0.5em] text-slate-500 uppercase italic">
            Engineered for sonic purity • v2.0
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;

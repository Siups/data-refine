import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Settings } from 'lucide-react';

const SeverancePomodoro = () => {
  const [view, setView] = useState('settings');
  const [workDuration, setWorkDuration] = useState(30);
  const [breakDuration, setBreakDuration] = useState(20);
  const [totalWorkTime, setTotalWorkTime] = useState(7.5 * 60 * 60);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isWork, setIsWork] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTotal, setElapsedTotal] = useState(0);
  const [currentTrack] = useState(0);
  const [musicPosition, setMusicPosition] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [windyPlaying, setWindyPlaying] = useState(false);
  
  const audioRef = useRef(null);
  const windyRef = useRef(null);
  const intervalRef = useRef(null);

  // Debug - sprawdź czy ref-y są gotowe
  useEffect(() => {
    console.log('audioRef:', audioRef.current);
    console.log('windyRef:', windyRef.current);
  }, []);

  const tracks = [
    'Track 1 - Ambient Dystopia',
    'Track 2 - Corporate Silence',
    'Track 3 - Severance Floor',
    'Track 4 - Data Refinement',
    'Track 5 - Innie Protocol',
    'Track 6 - Break Room',
    'Track 7 - The You You Are'
  ];

  const playWindyEffect = useCallback(() => {
    console.log('Trying to play windy effect...');
    if (windyRef.current) {
      console.log('windyRef exists');
      windyRef.current.currentTime = 0;
      windyRef.current.volume = 1.0;
      windyRef.current.play()
        .then(() => console.log('Windy effect playing!'))
        .catch(err => console.error('Windy play error:', err));
    } else {
      console.error('windyRef is null!');
    }
  }, []);

  const startFadeOut = useCallback(() => {
    console.log('Starting fade-out...');
    if (audioRef.current && !audioRef.current.paused) {
      const startVolume = audioRef.current.volume;
      let step = 0;
      const totalSteps = 5; // 5 kroków x 200ms = 1000ms (1 sekunda)
      
      const fadeInterval = setInterval(() => {
        step++;
        const newVolume = startVolume * (1 - step / totalSteps);
        
        if (step >= totalSteps || newVolume <= 0) {
          if (audioRef.current) {
            audioRef.current.volume = 0;
            audioRef.current.pause();
            setMusicPosition(audioRef.current.currentTime);
            console.log('Fade-out complete, music paused at:', audioRef.current.currentTime);
          }
          clearInterval(fadeInterval);
        } else {
          if (audioRef.current) {
            audioRef.current.volume = newVolume;
          }
        }
      }, 200);
    }
  }, []);

  const startWorkMusic = useCallback(() => {
    console.log('startWorkMusic called, musicPosition:', musicPosition);
    if (audioRef.current) {
      audioRef.current.currentTime = musicPosition;
      audioRef.current.volume = 0;
      audioRef.current.play()
        .then(() => console.log('Music started playing from:', musicPosition))
        .catch(err => console.error('Music play error:', err));
      
      let volume = 0;
      const fadeInterval = setInterval(() => {
        volume += 0.1;
        if (volume >= 0.7) {
          if (audioRef.current) {
            audioRef.current.volume = 0.7;
          }
          clearInterval(fadeInterval);
        } else {
          if (audioRef.current) {
            audioRef.current.volume = volume;
          }
        }
      }, 400);
    }
  }, [musicPosition]);

  const handleTimerEnd = useCallback(() => {
    setIsTransitioning(true);
    setIsRunning(false);
    
    const wasWork = isWork; // Zapisz aktualny stan przed zmianą
    
    // Zatrzymaj muzykę tylko jeśli kończy się praca
    if (wasWork && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setMusicPosition(audioRef.current.currentTime);
      console.log('Music paused at:', audioRef.current.currentTime);
    }
    
    setWindyPlaying(true);
    
    setTimeout(() => {
      playWindyEffect();
    }, 100);
    
    setTimeout(() => {
      setWindyPlaying(false);
      setIsWork(!wasWork); // Zmień stan
      setTimeLeft(wasWork ? breakDuration : workDuration);
      setIsTransitioning(false);
      
      // Jeśli kończyła się przerwa, uruchom muzykę
      if (!wasWork) {
        console.log('Break ending, starting work with music...');
        setTimeout(() => {
          setIsRunning(true);
          startWorkMusic();
        }, 100);
      } else {
        // Jeśli kończyła się praca, tylko uruchom timer (bez muzyki - to przerwa)
        console.log('Work ending, starting break...');
        setIsRunning(true);
      }
    }, 4000);
  }, [isWork, workDuration, breakDuration, playWindyEffect, startWorkMusic]);

  useEffect(() => {
    if (isRunning && !isPaused && !isTransitioning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Muzyka powinna być już wyciszona przez fade-out
            handleTimerEnd();
            return 0;
          }
          if (isWork && prev === 2) { // Ostatnia sekunda - fade-out
            console.log('1 second left, starting fade-out');
            startFadeOut();
          }
          return prev - 1;
        });
        
        if (isWork) {
          setElapsedTotal(prev => prev + 1);
        }
      }, 1000);
    }
    
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, isTransitioning, isWork, handleTimerEnd, startFadeOut]);

  const handleStart = () => {
    setView('timer');
    setIsWork(true);
    setTimeLeft(workDuration);
    setIsTransitioning(true);
    setWindyPlaying(true);
    
    // Opóźnij odtworzenie dźwięku żeby ref był gotowy
    setTimeout(() => {
      playWindyEffect();
    }, 100);
    
    setTimeout(() => {
      setWindyPlaying(false);
      setIsRunning(true);
      setIsTransitioning(false);
      startWorkMusic();
    }, 4000);
  };

  const togglePause = () => {
    if (isWork && !isTransitioning) {
      setIsPaused(!isPaused);
      if (!isPaused) {
        if (audioRef.current) {
          audioRef.current.pause();
          setMusicPosition(audioRef.current.currentTime);
        }
      } else {
        if (audioRef.current) {
          audioRef.current.currentTime = musicPosition;
          audioRef.current.play();
        }
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  };

  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-black text-gray-300 flex items-center justify-center p-8 font-mono">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-light tracking-widest mb-2">LUMON INDUSTRIES</h1>
            <div className="h-px bg-gray-700 w-32 mx-auto mb-4"></div>
            <p className="text-xs text-gray-500 tracking-wider">MACRODATA REFINEMENT</p>
          </div>

          <div className="space-y-6 border border-gray-800 p-8 bg-gray-950">
            <div>
              <label className="block text-xs mb-3 text-gray-400 tracking-wider">WORK CYCLE DURATION</label>
              <div className="grid grid-cols-5 gap-2">
                {[30, 15*60, 30*60, 45*60, 60*60].map((duration, i) => (
                  <button
                    key={i}
                    onClick={() => setWorkDuration(duration)}
                    className={`p-3 text-xs border transition-all ${
                      workDuration === duration 
                        ? 'border-white bg-white text-black' 
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {duration < 60 ? `${duration}s` : `${duration/60}m`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs mb-3 text-gray-400 tracking-wider">BREAK DURATION</label>
              <div className="grid grid-cols-4 gap-2">
                {[20, 5*60, 10*60, 30*60].map((duration, i) => (
                  <button
                    key={i}
                    onClick={() => setBreakDuration(duration)}
                    className={`p-3 text-xs border transition-all ${
                      breakDuration === duration 
                        ? 'border-white bg-white text-black' 
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {duration < 60 ? `${duration}s` : `${duration/60}m`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs mb-3 text-gray-400 tracking-wider">TOTAL WORK TIME</label>
              <input
                type="number"
                step="0.5"
                value={totalWorkTime / 3600}
                onChange={(e) => setTotalWorkTime(parseFloat(e.target.value) * 3600)}
                className="w-full p-3 bg-black border border-gray-700 text-white focus:border-gray-500 focus:outline-none"
              />
              <p className="text-xs text-gray-600 mt-2">Hours (default: 7.5)</p>
            </div>

            <button
              onClick={handleStart}
              className="w-full p-4 border border-white bg-white text-black hover:bg-black hover:text-white transition-all text-sm tracking-widest mt-8"
            >
              BEGIN REFINEMENT
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-mono relative overflow-hidden">
      <audio ref={audioRef} loop src="/track1.mp3" preload="auto" />
      <audio ref={windyRef} src="/windy_effect.mp3" preload="auto" />
      
      {windyPlaying && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="text-6xl mb-4">◉</div>
            <p className="text-sm tracking-widest text-gray-500">TRANSITIONING</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setView('settings')}
        className="absolute top-8 right-8 p-2 border border-gray-700 hover:border-white transition-all"
      >
        <Settings size={20} />
      </button>

      <div className="text-center space-y-12 max-w-2xl w-full">
        <div>
          <p className="text-xs text-gray-500 tracking-widest mb-4">
            {isWork ? 'INNIE - WORK CYCLE' : 'OUTIE - RECOVERY PERIOD'}
          </p>
          <div className="text-8xl font-light tracking-wider mb-4">
            {formatTime(timeLeft)}
          </div>
        </div>

        {isWork && (
          <button
            onClick={togglePause}
            disabled={isTransitioning}
            className="p-4 border border-gray-700 hover:border-white transition-all disabled:opacity-30"
          >
            {isPaused ? <Play size={24} /> : <Pause size={24} />}
          </button>
        )}

        <div className="mt-16 space-y-4">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTotalTime(elapsedTotal)}</span>
            <span>TOTAL ELAPSED</span>
          </div>
        </div>

        {isWork && (
          <div className="text-xs text-gray-600 mt-8">
            <p>NOW PLAYING: {tracks[currentTrack]}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeverancePomodoro;
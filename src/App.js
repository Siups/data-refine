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
  const [musicPosition, setMusicPosition] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [windyPlaying, setWindyPlaying] = useState(false);
  const [ytPlayer, setYtPlayer] = useState(null);
  const [ytReady, setYtReady] = useState(false);
  const [videoPlayer, setVideoPlayer] = useState(null);
  const [totalWorkInput, setTotalWorkInput] = useState('');
  const [isTotalWorkFocused, setIsTotalWorkFocused] = useState(false);
  const [oldWorkDuration, setOldWorkDuration] = useState(30);
  const [oldBreakDuration, setOldBreakDuration] = useState(20);
  
  const windyRef = useRef(null);
  const intervalRef = useRef(null);
  const playerRef = useRef(null);
  const videoPlayerRef = useRef(null);

  const YOUTUBE_VIDEO_ID = 'JRnDYB28bL8';

  // Załaduj YouTube API
  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        console.log('YouTube API already loaded');
        setYtReady(true);
        return;
      }

      if (!document.getElementById('youtube-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          console.log('YouTube API ready via callback');
          setYtReady(true);
        };
      }
    };

    loadYouTubeAPI();

    // Fallback - sprawdź co 500ms czy API jest gotowe
    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        console.log('YouTube API detected via polling');
        setYtReady(true);
        clearInterval(checkInterval);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, []);

  // Stwórz player gdy API jest gotowe
  useEffect(() => {
    if (!ytReady) {
      console.log('Waiting for YouTube API...');
      return;
    }

    if (ytPlayer) {
      console.log('Player already exists');
      return;
    }

    if (!playerRef.current) {
      console.log('playerRef not ready yet');
      return;
    }

    console.log('Creating YouTube player...');
    
    try {
      new window.YT.Player(playerRef.current, {
        height: '0',
        width: '0',
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            console.log('YouTube player ready!');
            setYtPlayer(event.target);
          },
          onError: (event) => {
            console.error('YouTube player error:', event.data);
          },
        },
      });
    } catch (error) {
      console.error('Error creating player:', error);
    }
  }, [ytReady, ytPlayer]);

  // Stwórz video player
  useEffect(() => {
    if (!ytReady) return;
    if (videoPlayer) return;
    if (!videoPlayerRef.current) return;

    console.log('Creating background video player...');
    
    try {
      new window.YT.Player(videoPlayerRef.current, {
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          mute: 1,
          loop: 1,
          playlist: YOUTUBE_VIDEO_ID,
        },
        events: {
          onReady: (event) => {
            console.log('Video player ready!');
            setVideoPlayer(event.target);
          },
        },
      });
    } catch (error) {
      console.error('Error creating video player:', error);
    }
  }, [ytReady, videoPlayer]);

  // Debug - sprawdź czy ref jest gotowy
  useEffect(() => {
    console.log('windyRef:', windyRef.current);
    console.log('ytPlayer:', ytPlayer);
  }, [ytPlayer]);

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
    if (ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === 1) {
      const startVolume = ytPlayer.getVolume();
      let step = 0;
      const totalSteps = 5;
      
      const fadeInterval = setInterval(() => {
        step++;
        const newVolume = startVolume * (1 - step / totalSteps);
        
        if (step >= totalSteps || newVolume <= 0) {
          ytPlayer.setVolume(0);
          ytPlayer.pauseVideo();
          setMusicPosition(ytPlayer.getCurrentTime());
          console.log('Fade-out complete, music paused at:', ytPlayer.getCurrentTime());
          clearInterval(fadeInterval);
        } else {
          ytPlayer.setVolume(newVolume);
        }
      }, 200);
    }
  }, [ytPlayer]);

  const startWorkMusic = useCallback(() => {
    console.log('startWorkMusic called, musicPosition:', musicPosition, 'ytPlayer:', ytPlayer);
    if (ytPlayer && ytPlayer.seekTo) {
      ytPlayer.seekTo(musicPosition, true);
      ytPlayer.setVolume(0);
      ytPlayer.playVideo();
      console.log('Music started playing from:', musicPosition);
      
      // Uruchom video
      if (videoPlayer) {
        videoPlayer.playVideo();
      }
      
      let step = 0;
      const totalSteps = 7;
      const targetVolume = 70;
      
      const fadeInterval = setInterval(() => {
        step++;
        const newVolume = (targetVolume * step) / totalSteps;
        
        if (step >= totalSteps) {
          ytPlayer.setVolume(targetVolume);
          clearInterval(fadeInterval);
        } else {
          ytPlayer.setVolume(newVolume);
        }
      }, 400);
    } else {
      console.error('ytPlayer not ready!');
    }
  }, [musicPosition, ytPlayer, videoPlayer]);

  const handleTimerEnd = useCallback(() => {
    console.log('Timer ended, starting transition');
    
    setIsTransitioning(true);
    setIsRunning(false);
    
    const wasWork = isWork;
    
    if (wasWork && ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === 1) {
      console.log('Music still playing, force pause');
      ytPlayer.pauseVideo();
      setMusicPosition(ytPlayer.getCurrentTime());
    }
    
    // Pauzuj video
    if (wasWork && videoPlayer) {
      videoPlayer.pauseVideo();
    }
    
    setWindyPlaying(true);
    
    setTimeout(() => {
      playWindyEffect();
    }, 100);
    
    setTimeout(() => {
      setWindyPlaying(false);
      setIsWork(!wasWork);
      const newDuration = wasWork ? breakDuration : workDuration;
      setTimeLeft(newDuration);
      
      // Aktualizuj "stare" wartości
      if (!wasWork) {
        setOldWorkDuration(workDuration);
      } else {
        setOldBreakDuration(breakDuration);
      }
      
      setIsTransitioning(false);
      
      if (!wasWork) {
        console.log('Break ending, starting work with music...');
        setTimeout(() => {
          setIsRunning(true);
          startWorkMusic();
        }, 100);
      } else {
        console.log('Work ending, starting break (no music)...');
        setIsRunning(true);
      }
    }, 4000);
  }, [isWork, workDuration, breakDuration, playWindyEffect, startWorkMusic, ytPlayer, videoPlayer]);

  useEffect(() => {
    if (isRunning && !isPaused && !isTransitioning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerEnd();
            return 0;
          }
          if (isWork && prev === 2) {
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
    if (!ytPlayer) {
      alert('YouTube player is not ready yet. Please wait a moment and try again.');
      return;
    }
    
    setView('timer');
    setIsWork(true);
    setTimeLeft(workDuration);
    setIsTransitioning(true);
    setWindyPlaying(true);
    
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
    if (isWork && !isTransitioning && ytPlayer) {
      setIsPaused(!isPaused);
      if (!isPaused) {
        ytPlayer.pauseVideo();
        setMusicPosition(ytPlayer.getCurrentTime());
        if (videoPlayer) {
          videoPlayer.pauseVideo();
        }
      } else {
        ytPlayer.seekTo(musicPosition, true);
        ytPlayer.playVideo();
        if (videoPlayer) {
          videoPlayer.playVideo();
        }
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpdateSettings = () => {
    // Oblicz ile czasu upłynęło w STARYM cyklu
    const oldCycleDuration = isWork ? oldWorkDuration : oldBreakDuration;
    const elapsedInCurrentCycle = oldCycleDuration - timeLeft;
    
    console.log('OLD cycle duration:', oldCycleDuration);
    console.log('Time left:', timeLeft);
    console.log('Elapsed in current cycle:', elapsedInCurrentCycle);
    
    // Ustaw nowy czas: NOWA długość cyklu minus to co już upłynęło
    const newCycleDuration = isWork ? workDuration : breakDuration;
    const newTimeLeft = Math.max(1, newCycleDuration - elapsedInCurrentCycle);
    
    console.log('NEW cycle duration:', newCycleDuration);
    console.log('New time left:', newTimeLeft);
    
    setTimeLeft(newTimeLeft);
    
    // Zapisz nowe wartości jako "stare" na przyszłość
    setOldWorkDuration(workDuration);
    setOldBreakDuration(breakDuration);
    
    setView('timer');
  };

  const formatTotalTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  };

  if (view === 'settings') {
    return (
      <>
        {/* Audio, YouTube player i przejścia - muszą być zawsze dostępne */}
        <div style={{ position: 'absolute', top: '-9999px' }}>
          <div ref={playerRef}></div>
        </div>
        <audio ref={windyRef} src="/windy_effect.mp3" preload="auto" />
        
        {/* Video player - ZAWSZE w DOM */}
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '100vh',
            transform: 'translate(-50%, -50%)',
            opacity: isWork ? 0.25 : 0,
            pointerEvents: 'none',
            zIndex: 0,
            transition: 'opacity 1s'
          }}
        >
          <div 
            ref={videoPlayerRef}
            title="Background video"
            style={{
              width: '100%',
              height: '100%'
            }}
          ></div>
        </div>
        
        {windyPlaying && (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            <div className="text-center animate-pulse">
              <div className="text-6xl mb-4 text-white">◉</div>
              <p className="text-sm tracking-widest text-gray-500">TRANSITIONING</p>
            </div>
          </div>
        )}
        
        <div className="min-h-screen bg-black text-gray-300 flex items-center justify-center p-8 font-mono relative">
        {/* Przycisk zamknięcia settings - tylko jeśli timer już działał */}
        {isRunning && (
          <button
            onClick={() => setView('timer')}
            className="absolute top-8 right-8 p-2 border border-gray-700 hover:border-white transition-all z-10"
          >
            <Settings size={20} />
          </button>
        )}
        
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
                step="0.01"
                value={isTotalWorkFocused ? totalWorkInput : ((totalWorkTime - elapsedTotal) / 3600).toFixed(2)}
                onFocus={(e) => {
                  setIsTotalWorkFocused(true);
                  setTotalWorkInput(e.target.value);
                }}
                onBlur={() => {
                  setIsTotalWorkFocused(false);
                  const value = parseFloat(totalWorkInput) || 0;
                  setTotalWorkTime(value * 3600 + elapsedTotal);
                }}
                onChange={(e) => {
                  if (isTotalWorkFocused) {
                    setTotalWorkInput(e.target.value);
                  }
                }}
                className="w-full p-3 bg-black border border-gray-700 text-white focus:border-gray-500 focus:outline-none"
              />
              <p className="text-xs text-gray-600 mt-2">
                Hours remaining (default: 7.5, elapsed: {formatTotalTime(elapsedTotal)})
              </p>
            </div>

            <button
              onClick={isRunning ? handleUpdateSettings : handleStart}
              className="w-full p-4 border border-white bg-white text-black hover:bg-black hover:text-white transition-all text-sm tracking-widest mt-8"
            >
              {isRunning ? 'UPDATE SETTINGS' : 'BEGIN REFINEMENT'}
            </button>
            
            {!ytPlayer && (
              <p className="text-xs text-yellow-600 text-center mt-2">
                Loading YouTube player...
              </p>
            )}
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-mono relative overflow-hidden">
      {/* YouTube audio player - ukryty */}
      <div style={{ position: 'absolute', top: '-9999px' }}>
        <div ref={playerRef}></div>
      </div>
      
      {/* Video player - ZAWSZE w DOM */}
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: '100vw',
          height: '100vh',
          transform: 'translate(-50%, -50%)',
          opacity: isWork ? 0.25 : 0,
          pointerEvents: 'none',
          zIndex: 0,
          transition: 'opacity 1s'
        }}
      >
        <div 
          ref={videoPlayerRef}
          title="Background video player"
          style={{
            width: '100%',
            height: '100%'
          }}
        ></div>
      </div>
      
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

      <div className="text-center space-y-12 max-w-2xl w-full relative z-10">
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
      </div>
    </div>
  );
};

export default SeverancePomodoro;
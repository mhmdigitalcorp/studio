'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Question } from '@/lib/data';
import { generateVoiceLessons } from '@/ai/flows/generate-voice-lessons';
import { Play, Pause, SkipForward, SkipBack, Volume2, Loader2, Info, Mic, History, FileQuestion, BookCopy, Code, BookOpen } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { cn } from '@/lib/utils';
import _ from 'lodash';
import { manageQuestion } from '@/ai/flows/manage-question';

type LearningState = 'category_selection' | 'lesson';

const fetchQuestions = async (): Promise<Question[]> => {
  const { success, questions } = await manageQuestion({ action: 'getAll' });
  if (success && questions) {
    return questions;
  }
  console.error('Failed to fetch questions for learning page.');
  return [];
};

const categoryIcons: { [key: string]: React.ReactNode } = {
  'History': <History className="h-8 w-8 mb-4 text-primary" />,
  'Science': <FileQuestion className="h-8 w-8 mb-4 text-primary" />,
  'General Knowledge': <BookCopy className="h-8 w-8 mb-4 text-primary" />,
  'Technology': <Code className="h-8 w-8 mb-4 text-primary" />,
  'default': <BookOpen className="h-8 w-8 mb-4 text-primary" />
};

export default function LearningPage() {
  const [learningState, setLearningState] = useState<LearningState>('category_selection');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState<'question' | 'answer' | null>(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  
  // Use ref for currentAudio to avoid dependency issues
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Record<string, { questionAudio: string; answerAudio: string }>>({});

  const { isListening, transcript } = useSpeechRecognition();

  const categories = useMemo(() => [...new Set(allQuestions.map(q => q.category))], [allQuestions]);
  const currentQuestion: Question | undefined = questions[currentIndex];

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const fetchedQuestions = await fetchQuestions();
      setAllQuestions(fetchedQuestions);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // FIXED: playAudio function without circular dependencies
  const playAudio = useCallback(async (type: 'question' | 'answer'): Promise<void> => {
    if (loadingAudio || !currentQuestion) return;

    // Stop any currently playing audio using the ref
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsPlaying(false);
    }

    setLoadingAudio(type);

    try {
      const cacheKey = `${currentQuestion.id}`;
      let audioSrc: string;

      if (audioCache.current[cacheKey]) {
        audioSrc = type === 'question' 
          ? audioCache.current[cacheKey].questionAudio 
          : audioCache.current[cacheKey].answerAudio;
      } else {
        const result = await generateVoiceLessons({
          question: currentQuestion.question,
          answer: currentQuestion.answer,
        });
        audioCache.current[cacheKey] = result;
        audioSrc = type === 'question' ? result.questionAudio : result.answerAudio;
      }

      const audio = new Audio(audioSrc);
      currentAudioRef.current = audio;

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          setIsPlaying(false);
          currentAudioRef.current = null;
          resolve();
        };
        
        audio.onerror = (error) => {
          console.error("Audio playback error:", error);
          setIsPlaying(false);
          currentAudioRef.current = null;
          setLoadingAudio(null);
          reject(error);
        };
        
        audio.play().then(() => {
          setIsPlaying(true);
          setLoadingAudio(null);
        }).catch(reject);
      });
    } catch (error) {
      console.error("Error in playAudio:", error);
      setLoadingAudio(null);
      throw error;
    }
  }, [currentQuestion, loadingAudio]); // REMOVED currentAudio from dependencies

  // FIXED: playSequence function
  const playSequence = useCallback(async (): Promise<void> => {
    if (isPlayingSequence || !currentQuestion) return;
    
    console.log('Starting play sequence');
    setIsPlayingSequence(true);
    
    try {
      console.log('Playing question...');
      await playAudio('question');
      console.log('Question finished, showing answer');
      setShowAnswer(true);
      
      console.log('Pausing before answer...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Playing answer...');
      await playAudio('answer');
      console.log('Answer finished');
      
    } catch (error) {
      console.error("Error in play sequence:", error);
    } finally {
      console.log('Play sequence completed');
      setIsPlayingSequence(false);
      setIsPlaying(false);
    }
  }, [isPlayingSequence, currentQuestion, playAudio]);

  // FIXED: Stable handler functions
  const handlePlayPause = useCallback(async (): Promise<void> => {
    if (isPlaying) {
      // Pause current audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        setIsPlaying(false);
        setIsPlayingSequence(false);
      }
    } else {
      // Start playing sequence
      await playSequence();
    }
  }, [isPlaying, playSequence]);

  const handleRepeat = useCallback(_.debounce(() => {
    playAudio('question');
  }, 300), [playAudio]);

  const handleNext = useCallback(_.debounce(() => {
    setCurrentIndex(i => (i + 1) % (questions.length || 1));
  }, 300), [questions.length]);

  const handlePrev = useCallback(_.debounce(() => {
    setCurrentIndex(i => (i - 1 + (questions.length || 1)) % (questions.length || 1));
  }, 300), [questions.length]);

  // Voice commands handler
  useEffect(() => {
    if (transcript) {
      const command = transcript.toLowerCase().trim();
      if (command.includes('next') || command.includes('skip')) {
        handleNext();
      } else if (command.includes('back') || command.includes('previous')) {
        handlePrev();
      } else if (command.includes('replay') || command.includes('repeat')) {
        handleRepeat();
      } else if (command.includes('play') || command.includes('start')) {
        handlePlayPause();
      } else if (command.includes('stop') || command.includes('pause')) {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          setIsPlaying(false);
          setIsPlayingSequence(false);
        }
      }
    }
  }, [transcript, handleNext, handlePrev, handleRepeat, handlePlayPause]);

  // Cleanup effects
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    // Reset audio when question changes
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      setIsPlaying(false);
      setIsPlayingSequence(false);
    }
    setShowAnswer(false);
  }, [currentIndex, selectedCategory]);

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    const categoryQuestions = allQuestions.filter(q => q.category === category);
    setQuestions(categoryQuestions);
    setLearningState('lesson');
    setCurrentIndex(0);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (learningState === 'category_selection') {
    return (
      <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Select a Category</CardTitle>
            <CardDescription>Choose a topic to start your voice-driven learning session.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.length > 0 ? categories.map(category => (
              <Card 
                key={category} 
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-secondary"
                onClick={() => selectCategory(category)}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  {categoryIcons[category] || categoryIcons.default}
                  <p className="font-semibold text-center">{category}</p>
                </CardContent>
              </Card>
            )) : (
              <p className="text-muted-foreground col-span-full text-center py-8">No learning categories found. Please add questions in the admin panel.</p>
            )}
        </CardContent>
      </Card>
    )
  }

  if (!currentQuestion) {
      return (
          <div className="text-center">
            <p>No questions found for this category.</p>
            <Button onClick={() => setLearningState('category_selection')} className="mt-4">Back to Categories</Button>
          </div>
      )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
          <div className="flex justify-between items-start">
              <div>
                  <CardTitle className="font-headline text-2xl flex items-center gap-2">
                      <Volume2 /> {selectedCategory}
                  </CardTitle>
                  <p className="text-muted-foreground">
                      Lesson {currentIndex + 1} of {questions.length}
                  </p>
              </div>
              <div className="flex items-center gap-2">
                  <Mic className={cn("text-muted-foreground transition-colors", isListening && "text-primary animate-pulse")} />
                  <Button variant="outline" onClick={() => {
                      setLearningState('category_selection');
                      if (currentAudioRef.current) currentAudioRef.current.pause();
                      setIsPlaying(false);
                  }}>Change Category</Button>
              </div>
          </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 bg-secondary/50 rounded-lg min-h-[120px] flex items-center justify-center">
          <p className="text-xl font-semibold text-center">{currentQuestion.question}</p>
        </div>

        {showAnswer && (
          <div className="p-6 bg-background rounded-lg border min-h-[120px] flex items-center justify-center animate-in fade-in">
            <p className="text-lg text-center text-muted-foreground">{currentQuestion.answer}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={handlePrev} disabled={loadingAudio !== null || isPlayingSequence}>
              <SkipBack />
            </Button>
          <Button size="lg" className="w-full sm:w-48" onClick={handlePlayPause} disabled={loadingAudio === 'question' || loadingAudio === 'answer' || isPlayingSequence}>
            {isPlayingSequence ? (
              <Loader2 className="animate-spin" />
            ) : loadingAudio ? (
              <Loader2 className="animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
              <span className="ml-2">{isPlayingSequence ? 'Playing...' : isPlaying ? 'Pause' : 'Play Lesson'}</span>
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext} disabled={loadingAudio !== null || isPlayingSequence}>
            <SkipForward />
          </Button>
        </div>

          <div className="flex items-center justify-center gap-4">
          <Button variant="secondary" onClick={() => setShowAnswer(s => !s)}>
              <Info className="mr-2 h-4 w-4" />
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </Button>
          <Button variant="secondary" onClick={() => playAudio('answer')} disabled={loadingAudio === 'answer' || isPlayingSequence}>
              {loadingAudio === 'answer' ? <Loader2 className="animate-spin mr-2"/> : <Volume2 className="mr-2 h-4 w-4" />}
              Play Answer Only
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-center mt-4 text-sm text-muted-foreground">
          Voice commands enabled: "Play", "Pause", "Next", "Back", "Replay"
        </p>
      </CardFooter>
    </Card>
  );
}

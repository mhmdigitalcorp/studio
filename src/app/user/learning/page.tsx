'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { questions as allQuestions, Question } from '@/lib/data';
import { generateVoiceLessons } from '@/ai/flows/generate-voice-lessons';
import { Play, Pause, SkipForward, SkipBack, Volume2, Loader2, Info, Mic } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import _ from 'lodash';


type LearningState = 'category_selection' | 'lesson';

export default function LearningPage() {
  const [learningState, setLearningState] = useState<LearningState>('category_selection');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<'question' | 'answer' | null>(null);
  const audioCache = useRef<Record<string, { questionAudio: string; answerAudio: string }>>({});

  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();

  const categories = [...new Set(allQuestions.map(q => q.category))];

  const currentQuestion: Question | undefined = questions[currentIndex];

  const handleNext = useCallback(_.debounce(() => {
    setCurrentIndex(i => (i + 1) % (questions.length || 1));
  }, 300), [questions.length]);

  const handlePrev = useCallback(_.debounce(() => {
    setCurrentIndex(i => (i - 1 + (questions.length || 1)) % (questions.length || 1));
  }, 300), [questions.length]);

  const handleRepeat = useCallback(_.debounce(() => {
    playAudio('question');
  }, 300), [currentQuestion]);
  
  useEffect(() => {
    if (transcript) {
      const command = transcript.toLowerCase().trim();
      if (command.includes('next') || command.includes('skip')) {
        handleNext();
      } else if (command.includes('back') || command.includes('previous')) {
        handlePrev();
      } else if (command.includes('replay') || command.includes('repeat')) {
        handleRepeat();
      }
    }
  }, [transcript, handleNext, handlePrev, handleRepeat]);


  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
      stopListening();
    };
  }, [currentAudio, stopListening]);


  useEffect(() => {
    if (currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    }
    setShowAnswer(false);
  }, [currentIndex, selectedCategory]);

  const playAudio = async (type: 'question' | 'answer') => {
    if (loadingAudio || !currentQuestion) return;

    if (currentAudio) {
      currentAudio.pause();
    }

    setLoadingAudio(type);

    let audioSrc = '';
    const cacheKey = `${currentQuestion.id}`;

    if (audioCache.current[cacheKey]) {
      audioSrc = type === 'question' ? audioCache.current[cacheKey].questionAudio : audioCache.current[cacheKey].answerAudio;
    } else {
      try {
        const result = await generateVoiceLessons({
          question: currentQuestion.question,
          answer: currentQuestion.answer,
        });
        audioCache.current[cacheKey] = result;
        audioSrc = type === 'question' ? result.questionAudio : result.answerAudio;
      } catch (error) {
        console.error("Error generating audio:", error);
        setLoadingAudio(null);
        return;
      }
    }
    
    const audio = new Audio(audioSrc);
    setCurrentAudio(audio);
    setLoadingAudio(null);
    audio.play();
    setIsPlaying(true);
    audio.onended = () => {
      if (type === 'question') {
        playAudio('answer');
      } else {
        setIsPlaying(false);
      }
    };
  };

  const handlePlayPause = () => {
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
        setIsPlaying(false);
      } else {
        currentAudio.play();
        setIsPlaying(true);
      }
    } else {
        playAudio('question');
    }
  };

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    const categoryQuestions = allQuestions.filter(q => q.category === category);
    setQuestions(categoryQuestions);
    setLearningState('lesson');
    setCurrentIndex(0);
  };


  if (learningState === 'category_selection') {
    return (
        <div className="container mx-auto max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Select a Category</CardTitle>
                    <p className="text-muted-foreground">Choose a topic to start your voice-driven learning session.</p>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map(category => (
                        <Button key={category} variant="outline" className="h-24 text-lg" onClick={() => selectCategory(category)}>
                            {category}
                        </Button>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!currentQuestion) {
      return (
          <div className="container mx-auto max-w-3xl text-center">
            <p>No questions found for this category.</p>
            <Button onClick={() => setLearningState('category_selection')} className="mt-4">Back to Categories</Button>
          </div>
      )
  }

  return (
    <div className="container mx-auto max-w-3xl">
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
                        if (currentAudio) currentAudio.pause();
                        setIsPlaying(false);
                    }}>Change Category</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-secondary/30 rounded-lg min-h-[120px] flex items-center justify-center">
            <p className="text-xl font-semibold text-center">{currentQuestion.question}</p>
          </div>

          {showAnswer && (
            <div className="p-6 bg-background rounded-lg border min-h-[120px] flex items-center justify-center animate-in fade-in">
              <p className="text-lg text-center text-muted-foreground">{currentQuestion.answer}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Button variant="outline" size="icon" onClick={handlePrev} disabled={loadingAudio !== null}>
                <SkipBack />
              </Button>
            <Button size="lg" onClick={handlePlayPause} disabled={loadingAudio === 'question' || loadingAudio === 'answer'}>
              {loadingAudio ? (
                <Loader2 className="animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
               <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext} disabled={loadingAudio !== null}>
              <SkipForward />
            </Button>
          </div>

           <div className="flex items-center justify-center gap-4">
            <Button variant="secondary" onClick={() => setShowAnswer(s => !s)}>
                <Info className="mr-2 h-4 w-4" />
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </Button>
            <Button variant="secondary" onClick={() => playAudio('answer')} disabled={loadingAudio === 'answer'}>
                {loadingAudio === 'answer' ? <Loader2 className="animate-spin mr-2"/> : <Volume2 className="mr-2 h-4 w-4" />}
                Play Answer Only
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="text-center mt-4 text-sm text-muted-foreground">
        Voice commands enabled: "Next", "Back", "Replay"
      </div>
    </div>
  );
}

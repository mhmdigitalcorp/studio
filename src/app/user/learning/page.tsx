'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { questions, Question } from '@/lib/data';
import { generateVoiceLessons } from '@/ai/flows/generate-voice-lessons';
import { Play, Pause, SkipForward, SkipBack, Volume2, Loader2, Info } from 'lucide-react';

export default function LearningPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<'question' | 'answer' | null>(null);
  const audioCache = useRef<Record<string, { questionAudio: string; answerAudio: string }>>({});

  const currentQuestion: Question = questions[currentIndex];

  useEffect(() => {
    // Stop any playing audio when the question changes
    if (currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    }
    setShowAnswer(false);
  }, [currentIndex]);
  
  const playAudio = async (type: 'question' | 'answer') => {
    if (loadingAudio) return;

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
    audio.onended = () => setIsPlaying(false);
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

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Volume2 /> Voice-First Learning
          </CardTitle>
          <p className="text-muted-foreground">
            Lesson {currentIndex + 1} of {questions.length}
          </p>
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
               <span className="ml-2">{isPlaying ? 'Pause' : 'Play Question'}</span>
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
                Play Answer
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

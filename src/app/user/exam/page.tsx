'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Question } from '@/lib/data';
import {
  adaptiveLearningFeedback,
  AdaptiveLearningFeedbackOutput,
} from '@/ai/flows/adaptive-learning-feedback';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Send,
  Repeat,
  Trophy,
  BookOpen,
  Mic,
  ArrowLeft,
  History,
  FileQuestion,
  BookCopy,
  Code,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useTTS } from '@/hooks/use-tts';
import { manageQuestion } from '@/ai/flows/manage-question';
import { useToast } from '@/hooks/use-toast';
import _ from 'lodash';

type ExamState = 'category_selection' | 'mode_selection' | 'ongoing' | 'finished';
type InteractionState =
  | 'idle'
  | 'reading_question'
  | 'listening'
  | 'processing'
  | 'correct'
  | 'incorrect'
  | 'retake_prompt';

const stateConfig: Record<
  InteractionState,
  {
    borderColor: string;
    micColor: string;
    prompt: string;
  }
> = {
  idle: {
    borderColor: 'border-border',
    micColor: 'bg-secondary text-secondary-foreground',
    prompt: 'Start the exam or wait for the next question.',
  },
  reading_question: {
    borderColor: 'border-primary',
    micColor: 'bg-secondary text-secondary-foreground',
    prompt: 'Listen to the question.',
  },
  listening: {
    borderColor: 'border-green-500',
    micColor: 'bg-green-500/20 text-green-400 animate-pulse',
    prompt: 'Listening for your answer...',
  },
  processing: {
    borderColor: 'border-yellow-500',
    micColor: 'bg-yellow-500/20 text-yellow-400',
    prompt: 'AI is grading your answer...',
  },
  correct: {
    borderColor: 'border-green-500',
    micColor: 'bg-green-500/80 text-white',
    prompt: 'Correct! Moving to the next question.',
  },
  incorrect: {
    borderColor: 'border-red-500',
    micColor: 'bg-red-500/80 text-white',
    prompt: 'Incorrect. The correct answer will be provided.',
  },
  retake_prompt: {
    borderColor: 'border-orange-500',
    micColor: 'bg-orange-500/20 text-orange-400',
    prompt: 'Say "Yes" to try again.',
  },
};

const categoryIcons: { [key: string]: React.ReactNode } = {
  History: <History className="h-8 w-8 mb-4 text-primary" />,
  Science: <FileQuestion className="h-8 w-8 mb-4 text-primary" />,
  'General Knowledge': <BookCopy className="h-8 w-8 mb-4 text-primary" />,
  Technology: <Code className="h-8 w-8 mb-4 text-primary" />,
  default: <BookOpen className="h-8 w-8 mb-4 text-primary" />,
};

const fetchQuestions = async (): Promise<Question[]> => {
  const { success, questions } = await manageQuestion({ action: 'getAll' });
  if (success && questions) {
    return questions;
  }
  console.error('Failed to fetch questions for exam page.');
  return [];
};

export default function ExamPage() {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<AdaptiveLearningFeedbackOutput | null>(null);
  const [examState, setExamState] = useState<ExamState>('category_selection');
  const [examMode, setExamMode] = useState<'learning'>('learning');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [interactionState, setInteractionState] = useState<InteractionState>('idle');
  
  const { toast } = useToast();
  const { isListening, transcript, startListening, stopListening, browserSupportsSpeechRecognition, micPermission } = useSpeechRecognition();
  const { speak, isSpeaking } = useTTS();
  const currentQuestion = examQuestions[currentQuestionIndex];
  const wasListening = useRef(false);

  // Debounced submission function
  const debouncedSubmit = useCallback(_.debounce((answer) => {
    // Only submit if we are in a listening state and have a valid answer
    if ((interactionState === 'listening' || interactionState === 'retake_prompt') && answer.trim()) {
      handleSubmit();
    }
  }, 1500), [interactionState]);
  
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const fetchedQuestions = await fetchQuestions();
      setAllQuestions(fetchedQuestions);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Effect to handle automatic submission
  useEffect(() => {
    if (transcript) {
      setUserAnswer(transcript);
    }

    // If we were listening, but now we are not, it means the user stopped talking.
    if (wasListening.current && !isListening && transcript.trim()) {
      // If it's a retake prompt, we check for "yes" immediately without debounce.
      if (interactionState === 'retake_prompt') {
        const confirmation = transcript.toLowerCase();
        if (confirmation.includes('yes') || confirmation.includes('okay')) {
          debouncedSubmit.cancel(); // Cancel any pending submission
          handleRetryQuestion();
        }
      } else {
        // For regular answers, use the debounced submission.
        debouncedSubmit(transcript);
      }
    }

    // Update the ref to track the listening state for the next render.
    wasListening.current = isListening;
  }, [transcript, isListening, interactionState, debouncedSubmit]);


  const handleQuestionSequence = useCallback(async () => {
    if (!currentQuestion) return;
    setInteractionState('reading_question');
    await speak(currentQuestion.question);
    
    if (micPermission === 'granted') {
      setInteractionState('listening');
      startListening();
    } else {
      // Fallback for no mic permission
      setInteractionState('listening'); 
    }
  }, [currentQuestion, speak, startListening, micPermission]);

  useEffect(() => {
    if (examState === 'ongoing' && interactionState === 'idle') {
      handleQuestionSequence();
    }
  }, [examState, interactionState, handleQuestionSequence]);

  const startExam = (mode: 'learning') => {
    const categoryQuestions = allQuestions.filter(q => q.category === selectedCategory);
    const shuffled = [...categoryQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 5);
    setExamQuestions(selectedQuestions);
    setScore({ correct: 0, total: selectedQuestions.length });
    setExamMode(mode);
    setExamState('ongoing');
    setInteractionState('idle');
  };

  const handleSubmit = async () => {
    // Cancel any pending debounced calls since we are now submitting.
    debouncedSubmit.cancel();

    if (!userAnswer.trim() || (interactionState !== 'listening' && interactionState !== 'retake_prompt')) return;
    
    stopListening();
    setInteractionState('processing');
    setFeedback(null);

    try {
      const result = await adaptiveLearningFeedback({
        question: currentQuestion.question,
        userAnswer,
        correctAnswer: currentQuestion.answer,
      });

      setFeedback(result);
      if (result.isCorrect) {
        setInteractionState('correct');
        setScore(s => ({ ...s, correct: s.correct + 1 }));
        await speak('Correct!');
        handleNextQuestion();
      } else {
        setInteractionState('incorrect');
        await speak('Incorrect. ' + result.feedback);
        await speak('The correct answer is: ' + currentQuestion.answer);
        setInteractionState('retake_prompt');
        await speak('Are you ready for a retake?');
        if (micPermission === 'granted') {
          startListening();
        }
      }
    } catch (error) {
      console.error('Error processing answer:', error);
      toast({ title: 'Error', description: 'Could not grade answer.', variant: 'destructive' });
      setInteractionState('listening');
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setFeedback(null);
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setInteractionState('idle');
    } else {
      setExamState('finished');
    }
  };

  const handleRetryQuestion = () => {
    setUserAnswer('');
    setFeedback(null);
    setInteractionState('idle'); // This will re-trigger the question sequence
  };

  const handleMicClick = () => {
    if (isListening) {
       stopListening();
       if (userAnswer.trim()) {
         handleSubmit(); // Manually trigger submit if mic is stopped and there is an answer
       }
    } else {
      if ((interactionState === 'listening' || interactionState === 'retake_prompt') && micPermission === 'granted') {
        startListening();
      }
    }
  };

  const resetExam = () => {
    setExamState('category_selection');
    setInteractionState('idle');
    setScore({ correct: 0, total: 0 });
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setSelectedCategory(null);
    stopListening();
  };
  
  const isMicActive = browserSupportsSpeechRecognition && micPermission === 'granted';

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (examState === 'category_selection') {
    const categories = [...new Set(allQuestions.map(q => q.category))];
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Select an Exam Category</CardTitle>
          <CardDescription>Choose a topic to test your knowledge.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(category => (
            <Card
              key={category}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-secondary"
              onClick={() => {
                setSelectedCategory(category);
                setExamState('mode_selection');
              }}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                {categoryIcons[category] || categoryIcons.default}
                <p className="font-semibold text-center">{category}</p>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (examState === 'mode_selection') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <Button variant="ghost" size="icon" onClick={() => setExamState('category_selection')} className="mb-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="font-headline text-2xl">Choose Exam Mode</CardTitle>
            <CardDescription>Selected category: {selectedCategory}</CardDescription>
          </CardHeader>
          <CardContent>
            <Card className="p-4 flex flex-col items-center text-center">
              <BookOpen className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold text-lg">Learning Mode</h3>
              <p className="text-sm text-muted-foreground mt-2">Get immediate feedback and retry incorrect questions until you get them right.</p>
              <Button className="mt-4 w-full" onClick={() => startExam('learning')}>Start Learning</Button>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (examState === 'finished') {
    const finalScore = Math.round((score.correct / examQuestions.length) * 100);
    return (
        <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
                <div className="flex justify-center">
                    <Trophy className="h-16 w-16 text-yellow-400" />
                </div>
                <CardTitle className="font-headline text-3xl">Exam Completed!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Your Final Score:</p>
                <p className="text-6xl font-bold text-primary my-4">{finalScore}%</p>
                <p className="text-muted-foreground">{score.correct} out of {examQuestions.length} initial questions correct.</p>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={resetExam}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Take Another Exam
                </Button>
            </CardFooter>
        </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card
        className={cn(
          'transition-all duration-300 border-2',
          stateConfig[interactionState].borderColor
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-headline text-2xl">AI-Proctored Exam: {selectedCategory}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span>Question {currentQuestionIndex + 1} of {examQuestions.length}</span>
                <span>Score: {score.correct}</span>
              </div>
            </div>
             <Button variant="outline" size="sm" onClick={resetExam}>Exit Exam</Button>
          </div>
          <Progress value={((currentQuestionIndex) / examQuestions.length) * 100} className="w-full mt-4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-secondary/50 rounded-lg min-h-[8rem] flex items-center justify-center">
            <p className="text-lg font-semibold text-center">{currentQuestion?.question}</p>
          </div>
          <div className="relative">
            <Textarea
              placeholder={stateConfig[interactionState].prompt}
              value={userAnswer}
              onChange={(e) => {
                setUserAnswer(e.target.value);
                // If user types, we should cancel automatic voice submission
                debouncedSubmit.cancel();
              }}
              disabled={interactionState !== 'listening' && interactionState !== 'retake_prompt'}
              rows={5}
              className={cn("pr-20 transition-all duration-300 border-2", stateConfig[interactionState].borderColor)}
            />
             {isMicActive && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleMicClick}
                  className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 transition-colors',
                    stateConfig[interactionState].micColor
                  )}
                  disabled={isSpeaking || interactionState === 'processing'}
                >
                  {interactionState === 'processing' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
                </Button>
             )}
          </div>
          <Button onClick={handleSubmit} disabled={(interactionState !== 'listening' && interactionState !== 'retake_prompt') || !userAnswer.trim() || isSpeaking} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            Submit Answer
          </Button>
        </CardContent>
        {feedback && (
          <CardFooter>
            <Alert variant={feedback.isCorrect ? 'default' : 'destructive'} className={cn(feedback.isCorrect && 'border-green-500/50 text-green-500')}>
              {feedback.isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertTitle>{feedback.isCorrect ? 'Correct!' : 'Needs Improvement'}</AlertTitle>
              <AlertDescription>{feedback.feedback}</AlertDescription>
            </Alert>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

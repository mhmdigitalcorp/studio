'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Question } from '@/lib/data';
import { adaptiveLearningFeedback, AdaptiveLearningFeedbackOutput } from '@/ai/flows/adaptive-learning-feedback';
import { aiProctoringExam } from '@/ai/flows/ai-proctoring-exam';
import { Loader2, CheckCircle, XCircle, Send, Repeat, Trophy, BookOpen, GraduationCap, Mic, ArrowLeft, History, FileQuestion, BookCopy, Code } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useTTS } from '@/hooks/use-tts';
import { manageQuestion } from '@/ai/flows/manage-question';

type ExamState = 'category_selection' | 'mode_selection' | 'ongoing' | 'feedback' | 'finished';
type ExamMode = 'learning' | 'exam';
type AnswerState = 'idle' | 'listening' | 'processing' | 'correct' | 'incorrect';

const categoryIcons: { [key: string]: React.ReactNode } = {
  'History': <History className="h-8 w-8 mb-4 text-primary" />,
  'Science': <FileQuestion className="h-8 w-8 mb-4 text-primary" />,
  'General Knowledge': <BookCopy className="h-8 w-8 mb-4 text-primary" />,
  'Technology': <Code className="h-8 w-8 mb-4 text-primary" />,
  'default': <BookOpen className="h-8 w-8 mb-4 text-primary" />
};

// Fetches live questions from the backend
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
  const [retryQueue, setRetryQueue] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<AdaptiveLearningFeedbackOutput | null>(null);
  const [examState, setExamState] = useState<ExamState>('category_selection');
  const [examMode, setExamMode] = useState<ExamMode>('learning');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'graded'>('idle');
  const hasQuestionBeenSpoken = useRef(false);

  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();
  const { speak } = useTTS();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const fetchedQuestions = await fetchQuestions();
      setAllQuestions(fetchedQuestions);
      setIsLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (transcript) {
      setUserAnswer(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (isListening) {
      setAnswerState('listening');
    } else if (answerState === 'listening') {
      setAnswerState('idle');
    }
  }, [isListening, answerState]);

  // Load questions when category is selected
  useEffect(() => {
    if (selectedCategory) {
      const categoryQuestions = allQuestions.filter(q => q.category === selectedCategory);
      const shuffled = [...categoryQuestions].sort(() => 0.5 - Math.random());
      const selectedQuestions = shuffled.slice(0, 5); // Limit to 5 questions for an exam
      setExamQuestions(selectedQuestions);
      setScore(s => ({...s, total: selectedQuestions.length}));
    }
  }, [selectedCategory, allQuestions]);

  const currentQuestion = examQuestions[currentQuestionIndex];
  
  // Reset the spoken flag when question changes
  useEffect(() => {
    hasQuestionBeenSpoken.current = false;
  }, [currentQuestion]);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      setUserAnswer('');
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Effect for speaking questions - only once per question
  useEffect(() => {
    if (examState === 'ongoing' && currentQuestion && !hasQuestionBeenSpoken.current) {
      hasQuestionBeenSpoken.current = true;
      speak(currentQuestion.question).catch(error => {
        console.error("TTS Error:", error);
      });
    }
  }, [examState, currentQuestion, speak]);

  const startExam = (mode: ExamMode) => {
    setExamMode(mode);
    setExamState('ongoing');
  };

  const totalQuestions = score.total;
  const questionsAnswered = currentQuestionIndex;

  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
        setAnswerState('idle');
        return;
    };
    
    stopListening();
    setExamState('feedback');
    setAnswerState('processing');
    setProcessingState('processing');
    setFeedback(null);

    let result;
    try {
      if (examMode === 'learning') {
        result = await adaptiveLearningFeedback({
          question: currentQuestion.question,
          userAnswer,
          correctAnswer: currentQuestion.answer,
        });
      } else {
        result = await aiProctoringExam({
          question: currentQuestion.question,
          userAnswer,
          expectedAnswer: currentQuestion.answer,
        });
      }
      
      setFeedback(result);
      setAnswerState(result.isCorrect ? 'correct' : 'incorrect');
      setProcessingState('graded');

      if (result.isCorrect) {
        setScore(s => ({ ...s, correct: s.correct + 1 }));
        speak("Correct!").catch(console.error);
      } else {
        speak("Incorrect. " + result.feedback).catch(console.error);
        if (examMode === 'learning') {
          setRetryQueue(q => [...q, currentQuestion]);
        }
      }
    } catch (error) {
       console.error("Error processing answer:", error);
       setAnswerState('idle');
       setProcessingState('idle');
    }
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setUserAnswer('');
    setAnswerState('idle');
    setProcessingState('idle');
    
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setExamState('ongoing');
    } else {
      if (examMode === 'learning' && retryQueue.length > 0) {
        setExamQuestions([...retryQueue]);
        setRetryQueue([]);
        setCurrentQuestionIndex(0);
        setScore(s => ({...s, total: retryQueue.length}));
        setExamState('ongoing');
      } else {
        setExamState('finished');
      }
    }
  };

  const resetExam = () => {
    setExamQuestions([]);
    setRetryQueue([]);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setExamState('category_selection');
    setExamMode('learning');
    setSelectedCategory(null);
    setScore({ correct: 0, total: 0 });
    setAnswerState('idle');
    setProcessingState('idle');
    stopListening();
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // Category Selection
  if (examState === 'category_selection') {
    const categories = [...new Set(allQuestions.map(q => q.category))];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Select an Exam Category</CardTitle>
          <CardDescription>Choose a topic to test your knowledge.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.length > 0 ? categories.map(category => (
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
          )) : (
            <p className="text-muted-foreground col-span-full text-center py-8">No exam categories found. Please add questions in the admin panel.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Mode Selection
  if (examState === 'mode_selection') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="icon" onClick={() => setExamState('category_selection')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="font-headline text-2xl">Choose Your Exam Mode</CardTitle>
            </div>
            <CardDescription>Selected category: {selectedCategory}</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 flex flex-col items-center text-center">
              <BookOpen className="h-12 w-12 text-primary mb-4"/>
              <h3 className="font-semibold text-lg">Learning Mode</h3>
              <p className="text-sm text-muted-foreground mt-2">Get immediate feedback and retry incorrect questions. Great for practice.</p>
              <Button className="mt-4 w-full" onClick={() => startExam('learning')}>Start Learning</Button>
            </Card>
            <Card className="p-4 flex flex-col items-center text-center">
              <GraduationCap className="h-12 w-12 text-primary mb-4"/>
              <h3 className="font-semibold text-lg">Exam Mode</h3>
              <p className="text-sm text-muted-foreground mt-2">A formal test of your knowledge. Answers graded for intent.</p>
              <Button className="mt-4 w-full" onClick={() => startExam('exam')}>Start Exam</Button>
            </Card>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examQuestions.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full gap-4 text-center">
        <p className="text-muted-foreground">There are no questions available for the '{selectedCategory}' category.</p>
        <Button onClick={() => setExamState('category_selection')}>Choose a Different Category</Button>
      </div>
    );
  }
  
  if (examState === 'finished') {
    const finalScore = Math.round((score.correct / totalQuestions) * 100);
    return (
        <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
                <div className="flex justify-center">
                    <Trophy className="h-16 w-16 text-yellow-400" />
                </div>
                <CardTitle className="font-headline text-3xl">Exam Completed!</CardTitle>
                <CardDescription>Category: {selectedCategory} | Mode: {examMode}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Your Final Score:</p>
                <p className="text-6xl font-bold text-primary my-4">{finalScore}%</p>
                <p className="text-muted-foreground">{score.correct} out of {totalQuestions} questions correct.</p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
                 <Button className="w-full sm:flex-1" onClick={() => resetExam()}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Take Another Exam
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
                  setExamState('category_selection');
                  resetExam();
                }}>
                  Change Category
                </Button>
            </CardFooter>
        </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
          <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-2xl">
                {`${examMode === 'learning' ? 'AI Learning Session' : 'AI-Proctored Exam'}: ${selectedCategory}`}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => {
              if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
                resetExam();
              }
            }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground my-2">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>Score: {score.correct}/{score.total}</span>
            {examMode === 'learning' && retryQueue.length > 0 && (
              <span>Retry: {retryQueue.length}</span>
            )}
          </div>
          <Progress value={(questionsAnswered / totalQuestions) * 100} className="w-full"/>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="p-6 bg-secondary/50 rounded-lg min-h-[8rem] flex items-center justify-center">
                  <p className="text-lg font-semibold text-center">{currentQuestion.question}</p>
              </div>
              <div className="relative">
                  <Textarea
                      placeholder={isListening ? "Listening..." : "Speak or type your answer here..."}
                      value={userAnswer}
                      onChange={(e) => {
                        setUserAnswer(e.target.value);
                        if (isListening) stopListening();
                        if (answerState === 'listening') setAnswerState('idle');
                      }}
                      disabled={examState === 'feedback' || processingState === 'processing'}
                      rows={5}
                      className="pr-12"
                  />
                  <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleMicClick}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 transition-colors", 
                        answerState === 'listening' && "bg-green-500/20 text-green-400 animate-pulse",
                        answerState === 'processing' && "bg-yellow-500/20 text-yellow-400",
                        answerState === 'correct' && "bg-green-500/80 text-white",
                        answerState === 'incorrect' && "bg-red-500/80 text-white",
                        answerState === 'idle' && "bg-secondary text-secondary-foreground"
                      )}
                      disabled={processingState === 'processing'}
                      aria-label={isListening ? "Stop listening" : "Start listening"}
                  >
                     {processingState === 'processing' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : answerState === 'listening' ? (
                        <div className="relative">
                          <Mic className="h-5 w-5" />
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        </div>
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                  </Button>
              </div>
              <Button onClick={handleSubmit} disabled={examState === 'feedback' || !userAnswer.trim() || isListening || processingState === 'processing'} className="w-full">
                  {answerState === 'processing' || processingState === 'processing' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit Answer
              </Button>
          </CardContent>
      </Card>
      
      {examState === 'feedback' && feedback && (
          <Card className="mt-4">
              <CardContent className="p-4">
                  <Alert variant={feedback.isCorrect ? "default" : "destructive"} className={cn(feedback.isCorrect && "border-green-500/50 text-green-500")}>
                      {feedback.isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <AlertTitle>{feedback.isCorrect ? "Correct!" : "Needs Improvement"}</AlertTitle>
                      <AlertDescription>{feedback.feedback}</AlertDescription>
                  </Alert>
                  <Button onClick={handleNextQuestion} className="w-full mt-4">Continue</Button>
              </CardContent>
          </Card>
      )}
    </div>
  );
}

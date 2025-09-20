'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { questions as allQuestions, Question } from '@/lib/data';
import { adaptiveLearningFeedback, AdaptiveLearningFeedbackOutput } from '@/ai/flows/adaptive-learning-feedback';
import { aiProctoringExam } from '@/ai/flows/ai-proctoring-exam';
import { Loader2, CheckCircle, XCircle, Send, Repeat, Trophy, BookOpen, GraduationCap, Mic, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useTTS } from '@/hooks/use-tts';

type ExamState = 'category_selection' | 'mode_selection' | 'ongoing' | 'feedback' | 'finished';
type ExamMode = 'learning' | 'exam';
type AnswerState = 'idle' | 'listening' | 'processing' | 'correct' | 'incorrect';

export default function ExamPage() {
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
      const selectedQuestions = shuffled.slice(0, 5);
      setExamQuestions(selectedQuestions);
      setScore(s => ({...s, total: selectedQuestions.length}));
    }
  }, [selectedCategory]);

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

  // Effect for starting listening after question is spoken
  useEffect(() => {
    if (examState === 'ongoing' && currentQuestion && !isListening) {
      // Wait a bit longer to ensure TTS has finished or failed
      const timer = setTimeout(() => {
        if (!isListening) {
          startListening();
        }
      }, 1500); // Increased delay to ensure TTS has time to start
      
      return () => clearTimeout(timer);
    }
  }, [examState, currentQuestion, isListening, startListening]);

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

  // Category Selection
  if (examState === 'category_selection') {
    const categories = [...new Set(allQuestions.map(q => q.category))];
    
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Select a Category</CardTitle>
            <CardDescription>Choose a topic for your exam or learning session.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map(category => (
              <Button 
                key={category} 
                variant="outline" 
                className="h-24 text-lg" 
                onClick={() => {
                  setSelectedCategory(category);
                  setExamState('mode_selection');
                }}
              >
                {category}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
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
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
            <CardFooter className="flex gap-2">
                 <Button className="flex-1" onClick={() => resetExam()}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Take Another Exam
                </Button>
                <Button variant="outline" onClick={() => {
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
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>Score: {score.correct}/{score.total}</span>
            {examMode === 'learning' && retryQueue.length > 0 && (
              <span>Retry: {retryQueue.length}</span>
            )}
          </div>
          <Progress value={(questionsAnswered / totalQuestions) * 100} className="w-full"/>
          </CardHeader>
          <CardContent className="space-y-4">
              <p className="text-lg font-semibold min-h-[6rem] flex items-center">{currentQuestion.question}</p>
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

'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { questions as allQuestions, Question } from '@/lib/data';
import { adaptiveLearningFeedback, AdaptiveLearningFeedbackOutput } from '@/ai/flows/adaptive-learning-feedback';
import { aiProctoringExam } from '@/ai/flows/ai-proctoring-exam';
import { Loader2, CheckCircle, XCircle, Send, Repeat, Trophy, BookOpen, GraduationCap, Mic } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useTTS } from '@/hooks/use-tts';

type ExamState = 'mode_selection' | 'ongoing' | 'feedback' | 'finished';
type ExamMode = 'learning' | 'exam';
type AnswerState = 'idle' | 'listening' | 'processing' | 'correct' | 'incorrect';

export default function ExamPage() {
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [retryQueue, setRetryQueue] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<AdaptiveLearningFeedbackOutput | null>(null);
  const [examState, setExamState] = useState<ExamState>('mode_selection');
  const [examMode, setExamMode] = useState<ExamMode>('learning');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'graded'>('idle');

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

  useEffect(() => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 5);
    setExamQuestions(selectedQuestions);
    setScore(s => ({...s, total: selectedQuestions.length}))
  }, []);

  const currentQuestion = examQuestions[currentQuestionIndex];
  
  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      setUserAnswer('');
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Separate effects for TTS and microphone control
  useEffect(() => {
    if (examState === 'ongoing' && currentQuestion) {
      speak(currentQuestion.question).catch(error => {
        console.error("TTS Error:", error);
        // Fallback to manual microphone start
        if (!isListening) {
          startListening();
        }
      });
    }
  }, [examState, currentQuestion, speak, isListening, startListening]);

  useEffect(() => {
    if (examState === 'ongoing' && currentQuestion && !isListening) {
      const timer = setTimeout(() => {
        startListening();
      }, 800); 
      
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
    setFeedback(null); // Clear previous feedback

    let result;
    try {
      if (examMode === 'learning') {
        result = await adaptiveLearningFeedback({
          question: currentQuestion.question,
          userAnswer,
          correctAnswer: currentQuestion.answer,
        });
      } else { // Exam mode
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
  
  if (examState === 'mode_selection') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Choose Your Exam Mode</CardTitle>
            <CardDescription>Select how you want to test your knowledge.</CardDescription>
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
    )
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
                <CardDescription>Congratulations on finishing the exam.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Your Final Score:</p>
                <p className="text-6xl font-bold text-primary my-4">{finalScore}%</p>
                <p className="text-muted-foreground">{score.correct} out of {totalQuestions} questions correct.</p>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={() => window.location.reload()}>
                    <Repeat className="mr-2 h-4 w-4" />
                    Take Another Exam
                </Button>
            </CardFooter>
        </Card>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
          <CardHeader>
          <CardTitle className="font-headline text-2xl">
              {`${examMode === 'learning' ? 'AI Learning Session' : 'AI-Proctored Exam'}: ${currentQuestion.category}`}
          </CardTitle>
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

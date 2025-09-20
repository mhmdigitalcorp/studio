'use client';
import { useState, useEffect } from 'react';
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

  const { listening, transcript, startListening, stopListening } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setUserAnswer(transcript);
    }
  }, [transcript]);
  
  useEffect(() => {
    if (listening) {
      setAnswerState('listening');
    } else if (answerState === 'listening') {
      // If it was listening and now it's not, it's processing
      setAnswerState('processing');
      handleSubmit();
    }
  }, [listening, answerState]); // Added answerState to dependency array

  useEffect(() => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 5);
    setExamQuestions(selectedQuestions);
    setScore(s => ({...s, total: selectedQuestions.length}))
  }, []);

  const startExam = (mode: ExamMode) => {
    setExamMode(mode);
    setExamState('ongoing');
  };

  const totalQuestions = score.total;
  const currentQuestion = examQuestions[currentQuestionIndex];
  const questionsAnswered = currentQuestionIndex;


  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
        setAnswerState('idle');
        return;
    };
    
    setExamState('feedback');
    setAnswerState('processing');
    setFeedback(null); // Clear previous feedback

    let result;
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

    if (result.isCorrect) {
      setScore(s => ({ ...s, correct: s.correct + 1 }));
    } else {
      if (examMode === 'learning') {
        setRetryQueue(q => [...q, currentQuestion]);
      }
    }
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setUserAnswer('');
    setAnswerState('idle');
    
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
  
  const handleMicClick = () => {
    if (listening) {
      stopListening();
    } else {
      setUserAnswer(''); // Clear text when starting to listen
      startListening();
    }
  };

  const answerStateClasses: Record<AnswerState, string> = {
    idle: 'bg-secondary text-secondary-foreground',
    listening: 'bg-green-500/20 text-green-400 animate-pulse',
    processing: 'bg-yellow-500/20 text-yellow-400',
    correct: 'bg-green-500/80 text-white',
    incorrect: 'bg-red-500/80 text-white',
  }

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
              {examMode === 'learning' ? 'AI Learning Session' : 'AI-Proctored Exam'}
          </CardTitle>
          <div className="flex items-center gap-4 pt-2">
              <Progress value={(questionsAnswered / totalQuestions) * 100} className="flex-1"/>
              <span className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          </div>
          </CardHeader>
          <CardContent className="space-y-4">
              <p className="text-lg font-semibold min-h-[6rem] flex items-center">{currentQuestion.question}</p>
              <div className="relative">
                  <Textarea
                      placeholder={listening ? "Listening..." : "Speak or type your answer here..."}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={examState === 'feedback'}
                      rows={5}
                      className="pr-12"
                  />
                  <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleMicClick}
                      className={cn("absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 transition-colors", answerStateClasses[answerState])}
                  >
                     {answerState === 'processing' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5"/>}
                  </Button>
              </div>
              <Button onClick={handleSubmit} disabled={examState === 'feedback' || !userAnswer.trim() || listening} className="w-full">
                  {answerState === 'processing' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
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

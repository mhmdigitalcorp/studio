'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { questions as allQuestions, Question } from '@/lib/data';
import { adaptiveLearningFeedback, AdaptiveLearningFeedbackOutput } from '@/ai/flows/adaptive-learning-feedback';
import { Loader2, CheckCircle, XCircle, Send, Repeat, Trophy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

type ExamState = 'ongoing' | 'feedback' | 'finished';

export default function ExamPage() {
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [retryQueue, setRetryQueue] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<AdaptiveLearningFeedbackOutput | null>(null);
  const [examState, setExamState] = useState<ExamState>('ongoing');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  
  useEffect(() => {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    setExamQuestions(shuffled.slice(0, 5)); // Take 5 random questions for the exam
    setScore(s => ({...s, total: 5}))
  }, []);

  const currentQuestion = examQuestions[currentQuestionIndex];
  const totalQuestions = score.total;
  const questionsAnswered = score.correct + retryQueue.length + (examState === 'feedback' ? 1 : 0) -1;

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;
    setExamState('feedback');
    setFeedback(null); // Clear previous feedback

    const result = await adaptiveLearningFeedback({
      question: currentQuestion.question,
      userAnswer,
      correctAnswer: currentQuestion.answer,
    });
    
    setFeedback(result);

    if (result.isCorrect) {
      setScore(s => ({ ...s, correct: s.correct + 1 }));
    } else {
      setRetryQueue(q => [...q, currentQuestion]);
    }
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setUserAnswer('');
    
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setExamState('ongoing');
    } else {
      // Finished initial questions, check retry queue
      if (retryQueue.length > 0) {
        setExamQuestions([...retryQueue]);
        setRetryQueue([]);
        setCurrentQuestionIndex(0);
        setExamState('ongoing');
      } else {
        setExamState('finished');
      }
    }
  };

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
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">AI-Proctored Exam</CardTitle>
          <div className="flex items-center gap-4 pt-2">
            <Progress value={(questionsAnswered / totalQuestions) * 100} className="flex-1"/>
            <span className="text-sm text-muted-foreground">Question {questionsAnswered + 1} of {totalQuestions}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-lg font-semibold">{currentQuestion.question}</p>
          <Textarea
            placeholder="Type your answer here..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={examState === 'feedback'}
            rows={5}
          />
          <Button onClick={handleSubmit} disabled={examState === 'feedback' || !userAnswer.trim()} className="w-full">
            {examState === 'feedback' && !feedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
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

'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { questions as allQuestions, Question } from '@/lib/data';
import { adaptiveLearningFeedback, AdaptiveLearningFeedbackOutput } from '@/ai/flows/adaptive-learning-feedback';
import { aiProctoringExam } from '@/ai/flows/ai-proctoring-exam';
import { Loader2, CheckCircle, XCircle, Send, Repeat, Trophy, BookOpen, GraduationCap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';

type ExamState = 'mode_selection' | 'ongoing' | 'feedback' | 'finished';
type ExamMode = 'learning' | 'exam';

export default function ExamPage() {
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [retryQueue, setRetryQueue] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<AdaptiveLearningFeedbackOutput | null>(null);
  const [examState, setExamState] = useState<ExamState>('mode_selection');
  const [examMode, setExamMode] = useState<ExamMode>('learning');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  
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

  const currentQuestion = examQuestions[currentQuestionIndex];
  const totalQuestions = score.total;
  const questionsAnswered = score.correct + (examMode === 'learning' ? retryQueue.length : (score.total - score.correct - (totalQuestions - (currentQuestionIndex + 1)))) + (examState === 'feedback' ? 1 : 0) -1;


  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;
    setExamState('feedback');
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
    
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setExamState('ongoing');
    } else {
      if (examMode === 'learning' && retryQueue.length > 0) {
        setExamQuestions([...retryQueue]);
        setRetryQueue([]);
        setCurrentQuestionIndex(0);
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
              <p className="text-sm text-muted-foreground mt-2">A formal test of your knowledge. Answers are graded at the end.</p>
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
    <div className="max-w-2xl mx-auto">
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

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, PlusCircle, Upload, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Question } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { bulkUpload } from '@/ai/flows/bulk-upload';
import { useToast } from '@/hooks/use-toast';

// Mock data fetching function. In a real app, this would be `onSnapshot` from Firebase.
const fetchQuestions = async (): Promise<Question[]> => {
  // Simulate API call
  await new Promise(res => setTimeout(res, 500));
  return [
    { id: "1", question: "What is the primary function of the mitochondria in a cell?", answer: "The primary function of mitochondria is to generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.", category: "Biology", remarks: "Key concept for cellular respiration." },
    { id: "2", question: "Who wrote 'To Kill a Mockingbird'?", answer: "Harper Lee wrote 'To Kill a Mockingbird'.", category: "Literature", remarks: "Published in 1960, a classic of modern American literature." },
    { id: "3", question: "What is the formula for calculating the area of a circle?", answer: "The formula for the area of a circle is A = πr², where r is the radius of the circle.", category: "Mathematics", remarks: "Pi (π) is approximately 3.14159." },
  ];
};


export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState<Omit<Question, 'id'>>({ question: '', answer: '', category: '', remarks: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadQuestions = useCallback(async () => {
    setIsLoading(true);
    const fetchedQuestions = await fetchQuestions();
    setQuestions(fetchedQuestions);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);


  const handleOpenCreateDialog = () => {
    setSelectedQuestion(null);
    setNewQuestion({ question: '', answer: '', category: '', remarks: '' });
    setCreateDialogOpen(true);
  };
  
  const handleOpenEditDialog = (question: Question) => {
    setSelectedQuestion(question);
    setNewQuestion(question);
    setCreateDialogOpen(true);
  };

  const handleOpenViewDialog = (question: Question) => {
    setSelectedQuestion(question);
    setViewDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (question: Question) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const handleDeleteQuestion = () => {
    if (questionToDelete) {
      // In a real app, call a backend flow to delete
      setQuestions(questions.filter((q) => q.id !== questionToDelete.id));
      toast({ title: "Question Deleted" });
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleSaveQuestion = () => {
    // In a real app, call a backend flow to create/update
    setIsProcessing(true);
    if (selectedQuestion) {
      // Update existing question
      setQuestions(questions.map((q) => (q.id === selectedQuestion.id ? { ...q, ...newQuestion, id: q.id } : q)));
      toast({ title: "Question Updated" });
    } else {
      // Create new question
      const newId = `q_${Date.now()}`;
      setQuestions([...questions, { id: newId, ...newQuestion }]);
      toast({ title: "Question Created" });
    }
    setIsProcessing(false);
    setCreateDialogOpen(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const csvData = await file.text();
      const result = await bulkUpload({ dataType: 'questions', csvData });
      if (result.success && result.updatedData) {
        toast({ title: "Upload Successful", description: result.message });
        setQuestions(result.updatedData as Question[]);
      } else {
         toast({ title: "Upload Failed", description: result.message, variant: "destructive" });
      }
      setIsProcessing(false);
    }
     // Reset file input
    if(event.target) {
        event.target.value = '';
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <FileQuestion />
                Content Management
              </CardTitle>
              <CardDescription>
                Create, update, and manage questions and answers.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleUploadClick} disabled={isProcessing}>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleFileChange}
              />
              <Button onClick={handleOpenCreateDialog} disabled={isProcessing}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Question
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isProcessing && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="w-[150px]">Category</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Answer</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                      <TableCell colSpan={6} className="p-4 text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{`Q-${String(q.id).padStart(4, '0')}`}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{q.category}</Badge>
                  </TableCell>
                  <TableCell className="max-w-sm truncate">{q.question}</TableCell>
                  <TableCell className="max-w-sm truncate">{q.answer}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{q.remarks || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isProcessing}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(q)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenViewDialog(q)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                         <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleOpenDeleteDialog(q)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">{selectedQuestion ? 'Edit Question' : 'Create New Question'}</DialogTitle>
            <DialogDescription>
              {selectedQuestion ? 'Update the details for this question.' : 'Fill in the form to add a new question to the system.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <Input id="category" value={newQuestion.category} onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })} className="col-span-3" disabled={isProcessing} />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="question" className="text-right pt-2">Question</Label>
              <Textarea id="question" value={newQuestion.question} onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })} className="col-span-3" rows={3} disabled={isProcessing}/>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="answer" className="text-right pt-2">Answer</Label>
              <Textarea id="answer" value={newQuestion.answer} onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })} className="col-span-3" rows={5} disabled={isProcessing} />
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="remarks" className="text-right pt-2">Remarks</Label>
              <Textarea id="remarks" value={newQuestion.remarks} onChange={(e) => setNewQuestion({ ...newQuestion, remarks: e.target.value })} className="col-span-3" rows={2} placeholder="Optional notes or hints..." disabled={isProcessing} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline" disabled={isProcessing}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveQuestion} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Dialog */}
      {selectedQuestion && (
        <Dialog open={isViewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline">Question Details</DialogTitle>
                    <DialogDescription>
                        <Badge variant="secondary">{selectedQuestion.category}</Badge>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <h4 className="font-semibold">Question</h4>
                        <p className="text-muted-foreground">{selectedQuestion.question}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Answer</h4>
                        <p className="text-muted-foreground">{selectedQuestion.answer}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Remarks</h4>
                        <p className="text-muted-foreground">{selectedQuestion.remarks || 'N/A'}</p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the question.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

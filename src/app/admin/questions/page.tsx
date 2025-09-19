'use client';

import React, { useState } from 'react';
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
import { FileQuestion, PlusCircle, Upload, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { questions as initialQuestions, Question } from '@/lib/data';
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
} from "@/components/ui/alert-dialog"

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState<Omit<Question, 'id'>>({ question: '', answer: '', category: '', remarks: '' });

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
      setQuestions(questions.filter((q) => q.id !== questionToDelete.id));
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleSaveQuestion = () => {
    if (selectedQuestion) {
      // Update existing question
      setQuestions(questions.map((q) => (q.id === selectedQuestion.id ? { ...q, ...newQuestion } : q)));
    } else {
      // Create new question
      const newId = Math.max(...questions.map(q => q.id), 0) + 1;
      setQuestions([...questions, { id: newId, ...newQuestion }]);
    }
    setCreateDialogOpen(false);
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
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
              <Button onClick={handleOpenCreateDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Question
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{`Q-${String(q.id).padStart(4, '0')}`}</TableCell>
                  <TableCell className="max-w-md truncate">{q.question}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{q.category}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{q.remarks || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
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
              <Input id="category" value={newQuestion.category} onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="question" className="text-right pt-2">Question</Label>
              <Textarea id="question" value={newQuestion.question} onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })} className="col-span-3" rows={3} />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="answer" className="text-right pt-2">Answer</Label>
              <Textarea id="answer" value={newQuestion.answer} onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })} className="col-span-3" rows={5} />
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="remarks" className="text-right pt-2">Remarks</Label>
              <Textarea id="remarks" value={newQuestion.remarks} onChange={(e) => setNewQuestion({ ...newQuestion, remarks: e.target.value })} className="col-span-3" rows={2} placeholder="Optional notes or hints..." />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveQuestion}>Save Question</Button>
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
              This action cannot be undone. This will permanently delete the question and its associated data from our servers.
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

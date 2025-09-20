'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListTodo, PlusCircle, Calendar as CalendarIcon, Clock, BarChart2, Bell, CheckCircle2, Edit, MoreVertical, Trash2, AlertTriangle, BadgeCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { todos as initialTodos, Todo } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format, isToday, isPast, parseISO, isEqual } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type FilterType = 'today' | 'overdue' | 'all';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [filter, setFilter] = useState<FilterType>('today');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isNewTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [isConflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [conflictingTasks, setConflictingTasks] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState({ title: '', dateTime: '' });
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // These state initializations are wrapped in useEffect to prevent hydration errors.
    // They will only run on the client side.
    setSelectedDate(new Date());
    const timer = setInterval(() => {
      setCurrentTime(format(new Date(), 'HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const checkForConflicts = (newDateTime: Date) => {
    const conflicts = todos.filter(todo => isEqual(parseISO(todo.dueDate), newDateTime));
    if (conflicts.length > 0) {
      setConflictingTasks(conflicts);
      setConflictDialogOpen(true);
      return true;
    }
    return false;
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.dateTime) return;

    const newDateTime = new Date(newTask.dateTime);
    if (checkForConflicts(newDateTime)) {
      return; // Stop if there's a conflict
    }
    
    const newTodoItem: Todo = {
      id: Date.now(),
      task: newTask.title.trim(),
      completed: false,
      priority: 'medium',
      dueDate: newDateTime.toISOString(),
      category: 'Uncategorized',
      subtasks: []
    };
    setTodos([newTodoItem, ...todos]);
    setNewTask({ title: '', dateTime: '' });
    setNewTaskDialogOpen(false);
  };


  const handleOpenDeleteDialog = (todo: Todo) => {
    setTodoToDelete(todo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTodo = () => {
    if (todoToDelete) {
      setTodos(todos.filter((t) => t.id !== todoToDelete.id));
      setDeleteDialogOpen(false);
      setTodoToDelete(null);
    }
  };

  const filteredTodos = useMemo(() => {
    let filtered = todos;

    if (filter === 'today') {
      filtered = todos.filter(todo => isToday(parseISO(todo.dueDate)));
    }
    if (filter === 'overdue') {
      filtered = todos.filter(todo => isPast(parseISO(todo.dueDate)) && !isToday(parseISO(todo.dueDate)) && !todo.completed);
    }
    
    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [todos, filter]);

  const stats = useMemo(() => {
    const tasksToday = todos.filter(todo => isToday(parseISO(todo.dueDate)));
    const overdueTasks = todos.filter(todo => isPast(parseISO(todo.dueDate)) && !isToday(parseISO(todo.dueDate)) && !todo.completed);
    const completedToday = tasksToday.filter(todo => todo.completed);
    return {
      today: tasksToday.length,
      overdue: overdueTasks.length,
      completed: completedToday.length,
    }
  }, [todos]);

  const daysWithTasks = useMemo(() => {
    return new Set(todos.map(todo => format(parseISO(todo.dueDate), 'yyyy-MM-dd')));
  }, [todos]);
  
  const taskDayModifier = {
    task: (date: Date) => daysWithTasks.has(format(date, 'yyyy-M-d')),
  };

  const priorityClasses = {
    high: 'border-red-500',
    medium: 'border-yellow-500',
    low: 'border-green-500',
    info: 'border-blue-500',
  };
  
  const categoryColors: { [key: string]: string } = {
    "Content": "bg-pink-500/20 text-pink-400",
    "Planning": "bg-blue-500/20 text-blue-400",
    "Administration": "bg-purple-500/20 text-purple-400",
    "Communication": "bg-green-500/20 text-green-400",
    "Uncategorized": "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
      {/* Left Panel: Calendar */}
      <div className="xl:col-span-3">
        <Card className="h-full">
           <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <CalendarIcon /> Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {selectedDate && (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={taskDayModifier}
                  modifiersClassNames={{
                    task: 'bg-primary/20 rounded-full'
                  }}
                />
            )}
            <Dialog open={isNewTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 w-full"><PlusCircle className="mr-2"/>New Task</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Task</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to add a new task to your list.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddNewTask} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Task Title</Label>
                    <Input 
                      id="task-title"
                      placeholder="e.g., Follow up with the design team"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({...prev, title: e.target.value}))}
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="task-datetime">Date and Time</Label>
                    <Input 
                      id="task-datetime"
                      type="datetime-local"
                      value={newTask.dateTime}
                      onChange={(e) => setNewTask(prev => ({...prev, dateTime: e.target.value}))}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Add Task</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Center Panel: Task List */}
      <div className="xl:col-span-5">
        <Card className="h-full">
          <CardHeader>
             <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <ListTodo />
              Task Manager
            </CardTitle>
            <CardDescription>
              Organize and track your internal tasks and deadlines.
            </CardDescription>
            <div className="flex items-center gap-2 pt-2">
                <Button variant={filter === 'today' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('today')}>Today</Button>
                <Button variant={filter === 'overdue' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('overdue')}>
                  Overdue <Badge variant="destructive" className="ml-2">{stats.overdue}</Badge>
                </Button>
                <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All Tasks</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
             <Separator />
            <div className="space-y-3 h-[calc(100vh-20rem)] overflow-y-auto pr-2">
              {filteredTodos.length > 0 ? filteredTodos.map((todo) => (
                <div key={todo.id} className={cn(
                    "flex items-start gap-3 p-3 rounded-md bg-secondary/30 border-l-4",
                    priorityClasses[todo.priority],
                    todo.completed && "opacity-60"
                  )}>
                  <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.completed}
                    onCheckedChange={() => handleToggleTodo(todo.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className={`font-medium leading-none ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {todo.task}
                    </label>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                       <span className={cn(
                          'flex items-center gap-1',
                          isPast(parseISO(todo.dueDate)) && !isToday(parseISO(todo.dueDate)) && !todo.completed && 'text-red-400 font-semibold'
                       )}>
                        <Clock className="h-3 w-3"/>
                        {format(parseISO(todo.dueDate), "MMM d, p")}
                       </span>
                       <Badge className={cn("px-1.5 py-0", categoryColors[todo.category] || categoryColors.Uncategorized)}>{todo.category}</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleOpenDeleteDialog(todo)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )) : (
                <div className="text-center text-muted-foreground py-10">
                  <p>No tasks for this view.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Planning & Details */}
      <div className="xl:col-span-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Clock /> Quick View</CardTitle>
          </CardHeader>
          <CardContent>
            {currentTime ? (
              <div className="flex items-center justify-center p-6 bg-secondary/50 rounded-md text-center">
                <div className="w-full">
                  <p className="font-headline text-5xl font-bold text-foreground">{currentTime}</p>
                  <p className="text-muted-foreground text-lg">{format(new Date(), 'EEEE, MMMM do')}</p>
                </div>
              </div>
            ) : (
                <div className="flex items-center justify-center p-6 bg-secondary/50 rounded-md text-center">
                  <p>Loading...</p>
                </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><BarChart2 /> Daily Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
             <div className="p-4 bg-secondary/50 rounded-md">
                <h3 className="text-2xl font-bold">{stats.today}</h3>
                <p className="text-sm text-muted-foreground">Today</p>
             </div>
             <div className="p-4 bg-secondary/50 rounded-md">
                <h3 className="text-2xl font-bold text-green-400">{stats.completed}</h3>
                <p className="text-sm text-muted-foreground">Completed</p>
             </div>
             <div className="p-4 bg-secondary/50 rounded-md">
                <h3 className="text-2xl font-bold text-red-400">{stats.overdue}</h3>
                <p className="text-sm text-muted-foreground">Overdue</p>
             </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Bell /> Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-1" />
                <div>
                  <p className="font-medium">Review bulk user import error logs</p>
                  <p className="text-sm text-muted-foreground">Was due yesterday</p>
                </div>
              </div>
              <Separator className="my-4" />
               <div className="flex items-start gap-3">
                <BadgeCheck className="h-5 w-5 text-green-400 mt-1" />
                <div>
                  <p className="font-medium">Finalize Q3 curriculum</p>
                  <p className="text-sm text-muted-foreground">Due today</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the task: "{todoToDelete?.task}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTodo} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Scheduling Conflict Detected</AlertDialogTitle>
            <AlertDialogDescription>
              There is already a task scheduled for this time. Please choose a different time.
              <Separator className="my-4"/>
              <h4 className="font-semibold mb-2">Existing Task:</h4>
              {conflictingTasks.map(task => (
                <div key={task.id} className="p-2 border rounded-md">
                    <p className="font-medium">{task.task}</p>
                    <p className="text-sm text-muted-foreground">{format(parseISO(task.dueDate), 'PPP p')}</p>
                </div>
              ))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setConflictDialogOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

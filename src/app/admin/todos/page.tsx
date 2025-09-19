'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListTodo, PlusCircle, Calendar, Clock, BarChart2, Bell, CheckCircle2, Edit, MoreVertical, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { todos as initialTodos, Todo } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format, isToday, isPast, isFuture, startOfToday } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type FilterType = 'today' | 'overdue' | 'all';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<FilterType>('today');

  const handleToggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      const newTodoItem: Todo = {
        id: Date.now(),
        task: newTodo.trim(),
        completed: false,
        priority: 'medium',
        dueDate: new Date().toISOString(),
        category: 'Uncategorized',
        subtasks: []
      };
      setTodos([...todos, newTodoItem]);
      setNewTodo('');
    }
  };

  const filteredTodos = useMemo(() => {
    const today = startOfToday();
    if (filter === 'today') {
      return todos.filter(todo => isToday(new Date(todo.dueDate)));
    }
    if (filter === 'overdue') {
      return todos.filter(todo => isPast(new Date(todo.dueDate)) && !isToday(new Date(todo.dueDate)) && !todo.completed);
    }
    return todos;
  }, [todos, filter]);

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
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
      {/* Left Panel: Calendar */}
      <div className="md:col-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Calendar /> Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 bg-secondary/50 rounded-md">
              <p className="text-muted-foreground">Calendar View Coming Soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Center Panel: Task List */}
      <div className="md:col-span-5">
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
                <Button variant={filter === 'overdue' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('overdue')}>Overdue</Button>
                <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All Tasks</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <Input 
                placeholder="Add a new task..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
              />
              <Button type="submit" size="icon"><PlusCircle className="h-4 w-4" /></Button>
            </form>
             <Separator />
            <div className="space-y-3 h-[calc(100vh-20rem)] overflow-y-auto pr-2">
              {filteredTodos.map((todo) => (
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
                          isPast(new Date(todo.dueDate)) && !isToday(new Date(todo.dueDate)) && !todo.completed && 'text-red-400 font-semibold'
                       )}>
                        {format(new Date(todo.dueDate), "MMM d")}
                       </span>
                       <Badge className={cn("px-1.5 py-0", categoryColors[todo.category] || categoryColors.Uncategorized)}>{todo.category}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Planning & Details */}
      <div className="md:col-span-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Clock /> Quick View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-24 bg-secondary/50 rounded-md">
              <p className="text-muted-foreground">Clock & Weather Coming Soon</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><BarChart2 /> Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-24 bg-secondary/50 rounded-md">
              <p className="text-muted-foreground">Stats Overview Coming Soon</p>
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Bell /> Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-24 bg-secondary/50 rounded-md">
              <p className="text-muted-foreground">Reminders List Coming Soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

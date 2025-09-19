'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListTodo, PlusCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { todos as initialTodos, Todo } from '@/lib/data';

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTodo, setNewTodo] = useState('');

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
      };
      setTodos([...todos, newTodoItem]);
      setNewTodo('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <ListTodo />
          To-Do List
        </CardTitle>
        <CardDescription>
          Organize and track your internal tasks and deadlines.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
          <Input 
            placeholder="Add a new task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <Button type="submit">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add
          </Button>
        </form>
        <div className="space-y-3">
          {todos.map((todo) => (
            <div key={todo.id} className="flex items-center space-x-3 p-3 rounded-md bg-secondary/50">
              <Checkbox
                id={`todo-${todo.id}`}
                checked={todo.completed}
                onCheckedChange={() => handleToggleTodo(todo.id)}
              />
              <label
                htmlFor={`todo-${todo.id}`}
                className={`flex-1 text-sm font-medium leading-none ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
              >
                {todo.task}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

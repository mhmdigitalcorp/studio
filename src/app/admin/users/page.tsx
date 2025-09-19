'use client';

import React, { useState, useMemo, useRef } from 'react';
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
import {
  Users as UsersIcon,
  Search,
  MoreHorizontal,
  PlusCircle,
  Trash2,
  Mail,
  ChevronDown,
  Wand2,
  Upload,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { users as initialUsers, User } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  generateEmailCampaign,
  GenerateEmailCampaignOutput,
} from '@/ai/flows/generate-email-campaigns';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [emailContent, setEmailContent] = useState<GenerateEmailCampaignOutput>({
    subject: '',
    body: '',
  });
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    phone: '',
    password: '',
    status: 'Active',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId]);
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleDeleteSelected = () => {
    setUsers(users.filter((user) => !selectedUsers.includes(user.id)));
    setSelectedUsers([]);
    setDeleteDialogOpen(false);
  };

  const handleAddUser = () => {
    const newId = `usr_${Date.now()}`;
    const userToAdd: User = {
      id: newId,
      name: newUser.name || 'New User',
      email: newUser.email || 'new.user@example.com',
      phone: newUser.phone || '',
      password: newUser.password,
      avatar: `https://i.pravatar.cc/150?u=${newId}`,
      status: newUser.status || 'Active',
      lastLogin: new Date().toISOString().split('T')[0],
      score: 0,
      progress: 0,
    };
    setUsers((prev) => [...prev, userToAdd]);
    setAddUserDialogOpen(false);
    setNewUser({ name: '', email: '', phone: '', password: '', status: 'Active' });
  };

  const handleGenerateEmail = async () => {
    const selectedUserDetails = users.filter((user) =>
      selectedUsers.includes(user.id)
    );
    const targetAudience = selectedUserDetails.map((u) => u.name).join(', ');

    const result = await generateEmailCampaign({
      campaignType: 'notification',
      topic: 'A general update for selected users',
      targetAudience: targetAudience,
    });
    setEmailContent(result);
  };

  const openEmailDialog = () => {
    setEmailContent({ subject: '', body: '' });
    setEmailDialogOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const newOrUpdatedUsers: User[] = lines.slice(1).map(line => {
          const data = line.split(',').map(d => d.trim().replace(/"/g, ''));
          const userObj: any = {};
          headers.forEach((header, index) => {
            userObj[header] = data[index] || '';
          });
          return {
            id: userObj.id || `usr_${Date.now()}_${Math.random()}`,
            name: userObj.name,
            email: userObj.email,
            phone: userObj.phone,
            avatar: userObj.avatar || `https://i.pravatar.cc/150?u=${userObj.id}`,
            status: userObj.status as 'Active' | 'Inactive',
            lastLogin: userObj.lastlogin || new Date().toISOString().split('T')[0],
            score: userObj.score ? parseInt(userObj.score) : 0,
            progress: userObj.progress ? parseInt(userObj.progress) : 0,
          };
        });

        // Merge with existing users, updating if ID matches, otherwise adding
        const usersMap = new Map(users.map(u => [u.id, u]));
        newOrUpdatedUsers.forEach(u => usersMap.set(u.id, u));
        setUsers(Array.from(usersMap.values()));
      };
      reader.readAsText(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleFileDownload = () => {
    const headers = ['id', 'name', 'email', 'phone', 'status', 'lastLogin', 'score', 'progress', 'avatar'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => headers.map(header => (user as any)[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'users.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
            <div>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <UsersIcon />
                User Oversight
              </CardTitle>
              <CardDescription>
                Monitor all registered users, track their progress, and manage
                accounts.
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleFileUpload}
              />
              <Button variant="outline" onClick={handleFileDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setAddUserDialogOpen(true)}>
                    Add Manually
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    Bulk Upload
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={selectedUsers.length === 0}>
                  Bulk Actions
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openEmailDialog}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Selected ({selectedUsers.length})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedUsers.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length
                    }
                    onCheckedChange={(checked) =>
                      handleSelectAll(Boolean(checked))
                    }
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Learning Progress</TableHead>
                <TableHead>Last Exam Score</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  data-state={selectedUsers.includes(user.id) && 'selected'}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) =>
                        handleSelectUser(user.id, Boolean(checked))
                      }
                      aria-label={`Select user ${user.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === 'Active' ? 'default' : 'outline'
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={user.progress} className="w-24" />
                      <span>{user.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        user.score > 80 ? 'text-green-400' : 'text-orange-400'
                      }`}
                    >
                      {user.score}%
                    </span>
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Reset Password</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Deactivate User
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

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">Add New User</DialogTitle>
            <DialogDescription>
              Fill out the form to add a new user to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newUser.status}
                onValueChange={(value) =>
                  setNewUser({
                    ...newUser,
                    status: value as 'Active' | 'Inactive',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected {selectedUsers.length} user(s) and their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline">
              Send Email to {selectedUsers.length} User(s)
            </DialogTitle>
            <DialogDescription>
              Generate and send an email campaign to the selected users.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input
                id="subject"
                value={emailContent.subject}
                onChange={(e) =>
                  setEmailContent({ ...emailContent, subject: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="body" className="text-right pt-2">
                Body
              </Label>
              <Textarea
                id="body"
                value={emailContent.body}
                onChange={(e) =>
                  setEmailContent({ ...emailContent, body: e.target.value })
                }
                className="col-span-3"
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleGenerateEmail}>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate with AI
            </Button>
            <Button>Send Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

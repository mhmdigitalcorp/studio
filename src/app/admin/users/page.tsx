'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { User } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { useToast } from '@/hooks/use-toast';
import { manageUser } from '@/ai/flows/manage-user';
import { bulkUpload } from '@/ai/flows/bulk-upload';


const fetchUsers = async (): Promise<User[]> => {
  const { success, users, message } = await manageUser({ action: 'getAll' });
  if (success) {
    return users || [];
  } else {
    console.error("Failed to fetch users:", message);
    return [];
  }
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailContent, setEmailContent] = useState<GenerateEmailCampaignOutput>({
    subject: '',
    body: '',
  });
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    phone: '',
    status: 'Active',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    const fetchedUsers = await fetchUsers();
    setUsers(fetchedUsers);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  const handleDeleteSelected = async () => {
    setIsProcessing(true);
    const result = await manageUser({ action: 'bulkDelete', userIds: selectedUsers });
    if (result.success && result.users) {
      toast({ title: 'Success', description: result.message });
      setUsers(result.users);
      setSelectedUsers([]);
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setDeleteDialogOpen(false);
    setIsProcessing(false);
  };

  const handleAddUser = async () => {
    setIsProcessing(true);
    const result = await manageUser({ action: 'create', userData: newUser });
     if (result.success && result.user) {
      setUsers(prev => [...prev, result.user!]);
      toast({ title: 'Success', description: 'User added successfully.' });
      setAddUserDialogOpen(false);
      setNewUser({ name: '', email: '', phone: '', status: 'Active' });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
    setIsProcessing(false);
  };

  const handleGenerateEmail = async () => {
    const selectedUserDetails = users.filter((user) =>
      selectedUsers.includes(user.id)
    );
    const targetAudience = selectedUserDetails.map((u) => u.name).join(', ');

    const result = await generateEmailCampaign({
      emailType: 'notification',
      tone: 'friendly',
      topic: 'A general update for selected users',
      targetAudience: targetAudience,
    });
    setEmailContent(result);
  };

  const openEmailDialog = () => {
    setEmailContent({ subject: '', body: '' });
    setEmailDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const csvData = await file.text();
      const result = await bulkUpload({ dataType: 'users', csvData });

      if (result.success && result.updatedData) {
        toast({ title: 'Upload Successful', description: result.message });
        setUsers(result.updatedData as User[]);
      } else {
        toast({ title: 'Upload Failed', description: result.message, variant: 'destructive' });
      }
      setIsProcessing(false);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleFileDownload = () => {
    if (users.length === 0) {
        toast({ title: "No data to download", variant: "destructive" });
        return;
    }
    const headers = ['id', 'name', 'email', 'phone', 'status', 'lastLogin', 'score', 'progress', 'avatar'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => headers.map(header => `"${(user as any)[header]}"`).join(','))
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
                disabled={isProcessing}
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
              <Button variant="outline" onClick={handleFileDownload} disabled={isProcessing}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={() => setAddUserDialogOpen(true)} disabled={isProcessing}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add User
              </Button>
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
                <Button variant="outline" disabled={selectedUsers.length === 0 || isProcessing}>
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
          <div className="relative">
            {isProcessing && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg"><Loader2 className="h-8 w-8 animate-spin" /></div>}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        !isLoading && filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length
                      }
                      onCheckedChange={(checked) =>
                        handleSelectAll(Boolean(checked))
                      }
                      aria-label="Select all"
                      disabled={isLoading}
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                      <TableCell colSpan={7} className="p-4 text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={7} className="p-4 text-center text-muted-foreground">
                          No users found.
                      </TableCell>
                    </TableRow>
                ) : (
                  filteredUsers.map((user) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">Add New User</DialogTitle>
            <DialogDescription>
              Fill out the form to add a new user to the system. An invite will be sent.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                disabled={isProcessing}
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
                 disabled={isProcessing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
                }
                 disabled={isProcessing}
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
                 disabled={isProcessing}
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
              <Button variant="outline" disabled={isProcessing}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddUser} disabled={!newUser.email || !newUser.name || isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add User
            </Button>
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
            </odules>
  "exclude": ["node_modules"]
}

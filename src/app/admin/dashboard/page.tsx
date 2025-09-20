'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  FileQuestion,
  Mail,
  ListTodo,
  Activity,
  Loader2,
} from 'lucide-react';
import { OverviewChart } from './components/overview-chart';
import { manageUser } from '@/ai/flows/manage-user';
import { manageQuestion } from '@/ai/flows/manage-question';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    questionsManaged: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [userResult, questionResult] = await Promise.all([
          manageUser({ action: 'getAll' }),
          manageQuestion({ action: 'getAll' }),
        ]);

        setStats({
          totalUsers: userResult.users?.length || 0,
          questionsManaged: questionResult.questions?.length || 0,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const StatCard = ({
    title,
    icon: Icon,
    value,
    description,
    loading,
  }: {
    title: string;
    icon: React.ElementType;
    value: string | number;
    description: string;
    loading: boolean;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          icon={Users}
          value={stats.totalUsers}
          description="+20.1% from last month"
          loading={isLoading}
        />
        <StatCard
          title="Questions Managed"
          icon={FileQuestion}
          value={stats.questionsManaged}
          description="+12 new this week"
          loading={isLoading}
        />
        <StatCard
          title="Email Campaigns"
          icon={Mail}
          value={3}
          description="1 active, 2 scheduled"
          loading={false}
        />
        <StatCard
          title="Pending Todos"
          icon={ListTodo}
          value={4}
          description="2 overdue"
          loading={false}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Activity />
            User Activity Overview
          </CardTitle>
          <CardDescription>
            Exams taken and lessons completed in the last 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OverviewChart />
        </CardContent>
      </Card>
    </div>
  );
}

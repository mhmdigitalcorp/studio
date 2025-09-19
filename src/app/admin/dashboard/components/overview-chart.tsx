'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartTooltipContent, ChartContainer, ChartConfig } from '@/components/ui/chart';

const data = [
  { name: 'Mon', lessons: 50, exams: 30 },
  { name: 'Tue', lessons: 65, exams: 45 },
  { name: 'Wed', lessons: 70, exams: 50 },
  { name: 'Thu', lessons: 40, exams: 25 },
  { name: 'Fri', lessons: 80, exams: 60 },
  { name: 'Sat', lessons: 95, exams: 75 },
  { name: 'Sun', lessons: 110, exams: 85 },
];

const chartConfig = {
  lessons: {
    label: "Lessons",
    color: "hsl(var(--chart-1))",
  },
  exams: {
    label: "Exams",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function OverviewChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
           <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
           <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
          <Bar dataKey="lessons" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="exams" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

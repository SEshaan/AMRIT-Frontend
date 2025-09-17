"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, BarChart, Map, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

const actions = [
  { name: 'Upload Data', href: '/upload', icon: FileUp },
  { name: 'Classification', href: '/classification', icon: BarChart },
  { name: 'Visualization', href: '/map', icon: Map },
];

const activities = [
  { action: 'Data Uploaded', detail: 'Site A', time: '2 hours ago', user: 'John Doe' },
  { action: 'Classification Updated', detail: 'Site B', time: '5 hours ago', user: 'Jane Smith' },
  { action: 'Comment Added', detail: 'Site C', time: '1 day ago', user: 'John Doe' },
];

export default function Home() {
  const [stats, setStats] = useState({ total: 0, polluted: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const response = await fetch('http://localhost:5000/api/data/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const result = await response.json();
        const categoryDist = result.data.categoryDistribution;
        
        const total = categoryDist.reduce((sum, cat) => sum + cat.count, 0);
        const polluted = categoryDist
          .filter(cat => cat._id === 'Unsafe' || cat._id === 'Mid')
          .reduce((sum, cat) => sum + cat.count, 0);

        setStats({ total, polluted });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setStats({ total: 'N/A', polluted: 'N/A' });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        {/* <p className="text-muted-foreground">Here's a summary of your water quality data.</p> */}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
              <Map className={`h-6 w-6 text-muted-foreground text-primary`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Polluted Sites</CardTitle>
              <Map className={`h-6 w-6 text-muted-foreground text-red-500`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.polluted}
              </div>
            </CardContent>
          </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-primary">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {actions.map((action) => (
            <Link href={action.href} key={action.name}>
              <Card className="hover:bg-accent hover:text-accent-foreground transition-colors group">
                <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                  <action.icon className="h-12 w-12 text-primary" />
                  <span className="font-semibold">{action.name}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* <div>
        <h2 className="text-xl font-semibold mb-4 text-primary">Recent Activity</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.detail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
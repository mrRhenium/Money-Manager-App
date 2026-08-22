"use client";

import { Skeleton, Card } from "antd";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-500">
      {/* Greeting Area Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton.Button active size="large" style={{ width: 200, height: 32, borderRadius: 8 }} />
          </div>
          <Skeleton.Button active size="small" style={{ width: 300, height: 20, borderRadius: 8 }} />
        </div>
        <Skeleton.Button active size="large" style={{ width: 160, borderRadius: 999 }} />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-none shadow-sm rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <Skeleton.Button active size="small" style={{ width: 80 }} />
              <Skeleton.Avatar active size="small" shape="circle" />
            </div>
            <Skeleton.Button active style={{ width: 120, height: 28, marginBottom: 8 }} />
            <Skeleton.Button active size="small" style={{ width: 60 }} />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Charts Skeleton */}
        <Card className="md:col-span-4 border-none shadow-sm rounded-xl">
          <Skeleton.Button active style={{ width: 180, height: 24, marginBottom: 24 }} />
          <Skeleton.Image active style={{ width: '100%', height: 300 }} />
        </Card>

        {/* Recent Transactions Skeleton */}
        <Card className="md:col-span-3 border-none shadow-sm rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <Skeleton.Button active style={{ width: 140, height: 24 }} />
            <Skeleton.Button active size="small" style={{ width: 60 }} />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton.Avatar active shape="square" size="large" style={{ borderRadius: 12 }} />
                  <div>
                    <Skeleton.Button active size="small" style={{ width: 100, marginBottom: 4 }} />
                    <br />
                    <Skeleton.Button active size="small" style={{ width: 140, height: 16 }} />
                  </div>
                </div>
                <Skeleton.Button active size="small" style={{ width: 60 }} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// src/app/analysis/page.tsx
'use client'
import { BarChart3, TrendingUp, Users, AlertTriangle } from 'lucide-react'

export default function AnalysisPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Analytics & Insights Dashboard
        </h1>
        <p className="text-lg text-slate-600">
          Comprehensive analysis of student performance and risk factors
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="h-8 w-8 text-blue-600" />}
          title="Total Students"
          value="1,247"
          change="+12%"
          color="bg-blue-50"
        />
        <StatCard
          icon={<AlertTriangle className="h-8 w-8 text-red-600" />}
          title="High Risk"
          value="156"
          change="+8%"
          color="bg-red-50"
        />
        <StatCard
          icon={<TrendingUp className="h-8 w-8 text-green-600" />}
          title="Retention Rate"
          value="94.2%"
          change="+2.1%"
          color="bg-green-50"
        />
        <StatCard
          icon={<BarChart3 className="h-8 w-8 text-purple-600" />}
          title="Predictions"
          value="892"
          change="+15%"
          color="bg-purple-50"
        />
      </div>

      {/* Placeholder for Charts */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-6">
          Risk Distribution Analysis
        </h3>
        <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
          <p className="text-slate-500">Charts will be implemented here</p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, change, color }: {
  icon: React.ReactNode
  title: string
  value: string
  change: string
  color: string
}) {
  return (
    <div className={`${color} rounded-xl p-6 border border-slate-200`}>
      <div className="flex items-center justify-between mb-4">
        {icon}
        <span className="text-sm font-medium text-green-600">{change}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-600">{title}</div>
    </div>
  )
}

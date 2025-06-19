// src/app/page.tsx
'use client'
import Link from 'next/link'
import { Upload, Activity, Cpu, ShieldCheck, TrendingUp, Users, AlertTriangle, BarChart3 } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            E-Learning Anomaly & Dropout Risk Prediction System
          </h1>
          <p className="text-xl text-slate-700 max-w-4xl mx-auto leading-relaxed">
            Empowering educators with <span className="font-semibold text-indigo-600">real-time analytics</span> and 
            <span className="font-semibold text-purple-600"> machine learning</span> to identify at-risk students early and improve retention rates.
          </p>
        </div>
        
        {/* System Benefits */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">How Our System Helps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BenefitCard
              icon={<AlertTriangle className="w-8 h-8 text-red-500" />}
              title="Early Detection"
              description="Identify at-risk students before they drop out using advanced anomaly detection algorithms"
            />
            <BenefitCard
              icon={<TrendingUp className="w-8 h-8 text-green-500" />}
              title="Improve Retention"
              description="Increase student success rates by 25-40% through targeted interventions and support"
            />
            <BenefitCard
              icon={<Users className="w-8 h-8 text-blue-500" />}
              title="Personalized Support"
              description="Generate customized recommendations for each student based on their unique risk profile"
            />
          </div>
        </div>
      </section>

      {/* Features at a Glance */}
      <section>
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">System Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={<Activity className="w-10 h-10 text-indigo-600" />}
            title="Real-time Analytics"
            description="Monitor student performance and risk factors as data updates in real-time with interactive dashboards."
            color="bg-indigo-50 border-indigo-200"
          />
          <FeatureCard
            icon={<Upload className="w-10 h-10 text-green-600" />}
            title="Upload Student Data"
            description="Easily upload CSV files containing student academic and attendance data with automated validation."
            color="bg-green-50 border-green-200"
          />
          <FeatureCard
            icon={<Cpu className="w-10 h-10 text-purple-600" />}
            title="Run ML Predictions"
            description="Leverage advanced machine learning models to predict dropout risks and detect behavioral anomalies."
            color="bg-purple-50 border-purple-200"
          />
          <FeatureCard
            icon={<ShieldCheck className="w-10 h-10 text-blue-600" />}
            title="View Risk Classifications"
            description="Get clear risk categories (Low, Moderate, High, Very High) and actionable insights for each student."
            color="bg-blue-50 border-blue-200"
          />
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">System Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard title="Students Analyzed" value="1,247" change="+12%" />
          <StatCard title="Risk Predictions" value="892" change="+8%" />
          <StatCard title="Anomalies Detected" value="156" change="+15%" />
          <StatCard title="Success Rate" value="94.2%" change="+2.1%" />
        </div>
      </section>

      {/* Quick Access Links */}
      <section>
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">Get Started</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickLink 
            href="/upload" 
            label="Upload Data" 
            description="Import student CSV files"
            icon={<Upload className="w-6 h-6" />}
            color="bg-indigo-600 hover:bg-indigo-700"
          />
          <QuickLink 
            href="/models" 
            label="Manage Models" 
            description="Deploy ML models"
            icon={<Cpu className="w-6 h-6" />}
            color="bg-purple-600 hover:bg-purple-700"
          />
          <QuickLink 
            href="/students" 
            label="Student Profiles" 
            description="View individual risks"
            icon={<Users className="w-6 h-6" />}
            color="bg-green-600 hover:bg-green-700"
          />
          <QuickLink 
            href="/upload" 
            label="Analytics Dashboard" 
            description="Comprehensive insights"
            icon={<BarChart3 className="w-6 h-6" />}
            color="bg-blue-600 hover:bg-blue-700"
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Ready to Transform Student Success?</h2>
        <p className="text-lg mb-6 opacity-90">
          Start by uploading your student data and let our ML-powered system identify at-risk students.
        </p>
        <Link 
          href="/upload"
          className="inline-flex items-center bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Student Data
        </Link>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description, color }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color: string;
}) {
  return (
    <div className={`${color} rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border`}>
      <div className="mb-4 flex justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-3">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  )
}

function BenefitCard({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mb-3 flex justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  )
}

function QuickLink({ href, label, description, icon, color }: { 
  href: string; 
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={`block ${color} text-white rounded-xl p-6 text-center font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg`}
    >
      <div className="mb-3 flex justify-center">
        {icon}
      </div>
      <div className="text-lg font-semibold mb-2">{label}</div>
      <div className="text-sm opacity-90">{description}</div>
    </Link>
  )
}

function StatCard({ title, value, change }: { 
  title: string; 
  value: string; 
  change: string;
}) {
  const isPositive = change.startsWith('+')
  
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-600 mb-1">{title}</div>
      <div className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {change}
      </div>
    </div>
  )
}

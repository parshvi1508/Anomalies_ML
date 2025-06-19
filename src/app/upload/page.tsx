// src/app/upload/page.tsx
'use client'
import { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Image from 'next/image'

interface PythonAnalysisResult {
  overview: {
    total_records: number
    total_features: number
    dropout_rate: number
  }
  plots: {
    correlation_heatmap: string
    feature_distributions: string
    boxplots: string
    gpa_vs_attendance: string
  }
  chart_data: any
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [analysisResults, setAnalysisResults] = useState<PythonAnalysisResult | null>(null)
  const [error, setError] = useState<string>('')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setUploading(true)
      setError('')
      
      try {
        const formData = new FormData()
        formData.append('file', selectedFile)
        
        // Fixed: Changed from '/api/analyze' to '/api/analyze-python'
        const response = await fetch('/api/analyze-python', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to analyze file`)
        }
        
        const results = await response.json()
        setAnalysisResults(results)
        setUploadStatus('success')
      } catch (error) {
        console.error('Error processing CSV:', error)
        setError(error instanceof Error ? error.message : 'Failed to process CSV file. Please check the format.')
        setUploadStatus('error')
      } finally {
        setUploading(false)
      }
    } else {
      setError('Please select a valid CSV file.')
      setUploadStatus('error')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Python-Powered Student Data Analytics
        </h1>
        <p className="text-lg text-slate-600">
          Upload your CSV file and run the exact Python analysis script
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors">
          <Upload className="mx-auto h-16 w-16 text-slate-400 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Upload Student Dataset
          </h3>
          <p className="text-slate-600 mb-6">
            Select your CSV file to run Python analysis with matplotlib/seaborn visualizations
          </p>
          
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
            disabled={uploading}
          />
          <label
            htmlFor="csv-upload"
            className="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileText className="mr-2 h-5 w-5" />
            {uploading ? 'Running Python Analysis...' : 'Choose CSV File'}
          </label>
        </div>

        {/* Upload Status */}
        {file && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-600">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              
              {uploadStatus === 'success' && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <span className="text-green-700 font-medium">Python Analysis Complete</span>
                </div>
              )}
              {uploadStatus === 'error' && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <span className="text-red-700 font-medium">Analysis Failed</span>
                </div>
              )}
            </div>
            {error && (
              <div className="mt-2 text-sm text-red-600">{error}</div>
            )}
          </div>
        )}
      </div>

      {/* Python Analysis Results */}
      {analysisResults && (
        <div className="space-y-8">
          {/* Dataset Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">📊 Dataset Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <OverviewCard title="Total Records" value={analysisResults.overview.total_records.toString()} />
              <OverviewCard title="Total Features" value={analysisResults.overview.total_features.toString()} subtitle="(excluding target)" />
              <OverviewCard title="Dropout Rate" value={`${analysisResults.overview.dropout_rate}%`} />
            </div>
          </div>

          {/* Python Generated Plots */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-slate-900">Exploratory Data Analysis</h3>
            
            {/* Correlation Heatmap */}
            <PlotCard title="🔗 Feature Correlation Heatmap" subtitle="Generated with seaborn">
              <Image 
                src={analysisResults.plots.correlation_heatmap} 
                alt="Correlation Heatmap"
                width={800}
                height={600}
                className="w-full h-auto rounded-lg"
              />
            </PlotCard>

            {/* Feature Distributions */}
            <PlotCard title="📈 Feature Distributions by Dropout Status" subtitle="Generated with seaborn histplot">
              <Image 
                src={analysisResults.plots.feature_distributions} 
                alt="Feature Distributions"
                width={1000}
                height={800}
                className="w-full h-auto rounded-lg"
              />
            </PlotCard>

            {/* Boxplots */}
            <PlotCard title="📦 Boxplot Analysis" subtitle="Generated with seaborn boxplot">
              <Image 
                src={analysisResults.plots.boxplots} 
                alt="Boxplots"
                width={1000}
                height={600}
                className="w-full h-auto rounded-lg"
              />
            </PlotCard>

            {/* Scatter Plot */}
            <PlotCard title="📉 GPA vs. Attendance Scatter Plot" subtitle="Generated with seaborn scatterplot">
              <Image 
                src={analysisResults.plots.gpa_vs_attendance} 
                alt="GPA vs Attendance"
                width={800}
                height={500}
                className="w-full h-auto rounded-lg"
              />
            </PlotCard>
          </div>
        </div>
      )}
    </div>
  )
}

function PlotCard({ title, subtitle, children }: { 
  title: string; 
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
      <div className="flex justify-center">
        {children}
      </div>
    </div>
  )
}

function OverviewCard({ title, value, subtitle }: { 
  title: string; 
  value: string; 
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-600 mb-1">{title}</div>
      {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
    </div>
  )
}
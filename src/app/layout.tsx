// src/app/layout.tsx
import './globals.css';
import Navigation from '@/components/Navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'E-Learning Anomaly Detection & Dropout Risk Prediction System',
  description: 'Anomaly detection and dropout risk prediction system for e-learning platforms using machine learning algorithms',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 to-blue-50 text-slate-900 min-h-screen antialiased">
        <div className="min-h-screen flex flex-col">
          {/* Header with system title */}
          <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200/60 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                        E-Learning Anomaly Detection & Dropout Risk Prediction
                      </h1>
                      <p className="text-sm lg:text-base text-slate-600 mt-1 font-medium">
                        Anomaly detection and dropout risk prediction system for e-learning platforms using machine learning algorithms
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className="hidden lg:flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-full border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">System Active</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    v2.1.0
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          {/* Navigation */}
          <Navigation />
          
          {/* Main Content */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 min-h-[600px] p-8">
              {children}
            </div>
          </main>
          
          {/* Footer */}
          <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-8 border-t border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-slate-300">
                    © 2025 
                  </div>
                  <div className="hidden md:block w-px h-4 bg-slate-600"></div>
                  <div className="text-sm text-slate-400">
                    Powered by ML Algorithms - Isolation Forest, Randim Forrest Classifier and Demspter Shafer
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-slate-400">
                  <span>Evidence Theory</span>
                  <span>•</span>
                  <span>Real-time Analytics</span>
                  <span>•</span>
                  <span>Predictive Intelligence</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

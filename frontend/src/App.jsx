import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import RecruiterDashboard from './components/RecruiterDashboard'
import CandidateInterview from './components/CandidateInterview'
import ResultsPage from './components/ResultsPage'
import RubricEditor from './components/RubricEditor'
import ThankYou from './components/ThankYou'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">AI Interview Dashboard</h1>
            <nav className="flex gap-4">
              <Link to="/" className="text-indigo-600">Recruiter</Link>
              <Link to="/results" className="text-indigo-600">Results</Link>
              <Link to="/rubrics" className="text-indigo-600">Rubrics</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-6">
          <Routes>
            <Route path="/" element={<RecruiterDashboard />} />
            <Route path="/candidate/:token" element={<CandidateInterview />} />
            <Route path="/candidate/:token/complete" element={<ThankYou />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/rubrics" element={<RubricEditor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

import React, { useEffect, useState } from 'react'
import RubricEditorCandidate from './RubricEditorCandidate'

export default function ResultsPage() {
  const [rows, setRows] = useState([])

  useEffect(()=>{ (async()=>{
    const r = await fetch('/api/results')
    const j = await r.json()
    setRows(j.candidates || [])
  })() }, [])

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h2 className="text-lg font-semibold mb-4">Results</h2>
      <div className="space-y-4">
        {rows.length === 0 && <div className="text-gray-500">No results yet.</div>}
        {rows.map(r => (
          <div key={r.token} className="border rounded p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{r.name} — {r.role}</div>
                <div className="text-sm text-gray-500">{r.email}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">Total: {r.total_score}</div>
                <a className="text-indigo-600 text-sm underline" href={r.interview_link} target="_blank" rel="noreferrer">Open Interview</a>
              </div>
            </div>

            <div className="mt-3 grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Answers</h4>
                <ol className="list-decimal pl-5 mt-2 space-y-2">
                  {(r.answers||[]).sort((a,b)=>a.q_index-b.q_index).map((a,idx)=>
                    <li key={idx} className="text-sm">
                      <div className="text-xs text-gray-500">Score: {a.score}</div>
                      <div className="mt-1 whitespace-pre-wrap">{a.transcript || '(no transcript)'}</div>
                      {a.media_url && <a className="text-indigo-600 text-xs underline" href={a.media_url} target="_blank" rel="noreferrer">View video</a>}
                    </li>
                  )}
                </ol>
              </div>

              <div>
                <h4 className="font-semibold">Rubric</h4>
                <RubricEditorCandidate token={r.token} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

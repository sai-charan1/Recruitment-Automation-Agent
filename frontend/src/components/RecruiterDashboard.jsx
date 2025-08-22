import React, { useState, useEffect } from "react";

export default function RecruiterDashboard() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [resume, setResume] = useState(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [candidates, setCandidates] = useState([]);

  // Fetch candidates from backend
  useEffect(() => {
    fetch("http://localhost:8000/candidates")
      .then((res) => res.json())
      .then((data) => {
        const arr = Object.entries(data).map(([token, cand]) => ({
          token,
          ...cand,
        }));
        setCandidates(arr);
      });
  }, []);

  const createCandidate = async () => {
    const fd = new FormData();
    fd.append("name", name);
    fd.append("role", role);
    fd.append("limit", numQuestions);
    if (resume) fd.append("resume", resume);

    const res = await fetch("http://localhost:8000/candidates", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    alert("Candidate created with token " + data.token);

    // Refresh list
    fetch("http://localhost:8000/candidates")
      .then((res) => res.json())
      .then((data) => {
        const arr = Object.entries(data).map(([token, cand]) => ({
          token,
          ...cand,
        }));
        setCandidates(arr);
      });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Recruiter Dashboard</h2>

      {/* Create Candidate Form */}
      <div className="bg-white shadow rounded p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Create Candidate</h3>
        <div className="flex gap-4 mb-3">
          <input
            type="text"
            placeholder="Candidate Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 flex-1"
          />
          <input
            type="text"
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border p-2 flex-1"
          />
          <input
            type="number"
            placeholder="No. of Questions"
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            className="border p-2 w-40"
          />
        </div>
        <input
          type="file"
          onChange={(e) => setResume(e.target.files[0])}
          className="mb-3"
        />
        <button
          onClick={createCandidate}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Create Candidate
        </button>
      </div>

      {/* Candidate List */}
      <h3 className="text-lg font-semibold mb-3">Candidates</h3>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Resume</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.token}>
              <td className="border p-2">{c.name}</td>
              <td className="border p-2">{c.role}</td>
              <td className="border p-2">
                {c.resume_filename ? c.resume_filename : "N/A"}
              </td>
              <td className="border p-2">
                <a
                  href={`http://localhost:5173/candidate/${c.token}`}
                  className="text-indigo-600 underline mr-3"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Interview
                </a>
                <a
                  href={`http://localhost:5173/rubric-candidate?token=${c.token}`}
                  className="text-green-600 underline"
                >
                  Edit Rubric
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

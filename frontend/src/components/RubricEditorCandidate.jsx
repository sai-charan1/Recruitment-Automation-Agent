import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function RubricEditorCandidate() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [criteria, setCriteria] = useState([]);

  useEffect(() => {
    if (token) {
      fetch(`http://localhost:8000/rubric/${token}`)
        .then((res) => res.json())
        .then((data) => setCriteria(data.criteria || []));
    }
  }, [token]);

  const addCriterion = () =>
    setCriteria([...criteria, { text: "", weight: 1 }]);

  const saveRubric = async () => {
    await fetch("http://localhost:8000/rubric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, criteria }),
    });
    alert("Rubric saved!");
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Rubric for Candidate</h2>
      {criteria.map((c, idx) => (
        <div key={idx} className="flex gap-2 mb-2">
          <input
            type="text"
            value={c.text}
            onChange={(e) => {
              const updated = [...criteria];
              updated[idx].text = e.target.value;
              setCriteria(updated);
            }}
            placeholder="Criterion"
            className="border p-2 flex-1"
          />
          <input
            type="number"
            value={c.weight}
            onChange={(e) => {
              const updated = [...criteria];
              updated[idx].weight = parseInt(e.target.value);
              setCriteria(updated);
            }}
            className="border p-2 w-20"
          />
        </div>
      ))}
      <button
        onClick={addCriterion}
        className="bg-gray-300 px-3 py-1 rounded mr-2"
      >
        + Add Criterion
      </button>
      <button
        onClick={saveRubric}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        Save Rubric
      </button>
    </div>
  );
}

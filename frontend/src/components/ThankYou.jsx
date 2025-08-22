import React from 'react'
import { Link } from 'react-router-dom'

export default function ThankYou() {
  return (
    <div className="bg-white rounded-2xl p-10 shadow text-center">
      <h2 className="text-2xl font-bold text-indigo-700">🎉 Thank you!</h2>
      <p className="mt-4 text-gray-600">Your interview has been submitted successfully.</p>
      <Link to="/" className="mt-6 inline-block bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700">Back to Home</Link>
    </div>
  )
}

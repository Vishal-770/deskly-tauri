import { Routes } from '@generouted/react-router'
import './App.css'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Put site-level wrappers, providers or layout here */}
        <Routes />
      </div>
    </div>
  )
}


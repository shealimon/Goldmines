'use client';

import { useState } from 'react';

export default function GenerateCaseStudy() {
  const [formData, setFormData] = useState({
    person_name: '',
    company_name: '',
    image_url: '',
    cofounders: ''
  });
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Process cofounders string into array
      const cofoundersArray = formData.cofounders 
        ? formData.cofounders.split(',').map(name => name.trim()).filter(name => name)
        : [];

      const response = await fetch('/api/case-studies/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          cofounders: cofoundersArray
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate case study');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;

    setBulkLoading(true);
    setError(null);
    setBulkResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const response = await fetch('/api/case-studies/bulk-generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process CSV file');
      }

      setBulkResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Generate Case Study
          </h1>

          {/* CSV Bulk Upload Section */}
          <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              📊 Bulk Generate from CSV
            </h2>
            <p className="text-sm text-blue-700 mb-4">
              Upload a CSV file with columns: person_name, company_name, cofounders (optional)
            </p>
            
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label htmlFor="csvFile" className="block text-sm font-medium text-blue-700 mb-2">
                  CSV File
                </label>
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  required
                  className="w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {csvFile && (
                  <p className="mt-1 text-xs text-blue-600">
                    Selected: {csvFile.name}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={bulkLoading || !csvFile}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {bulkLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing CSV...
                  </>
                ) : (
                  '🚀 Process CSV File'
                )}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="person_name" className="block text-sm font-medium text-gray-700 mb-2">
                Person Name *
              </label>
              <input
                type="text"
                id="person_name"
                name="person_name"
                value={formData.person_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Elon Musk"
              />
            </div>

            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Tesla"
              />
            </div>

            <div>
              <label htmlFor="cofounders" className="block text-sm font-medium text-gray-700 mb-2">
                Cofounders (optional)
              </label>
              <input
                type="text"
                id="cofounders"
                name="cofounders"
                value={formData.cofounders}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Steve Jobs, Steve Wozniak (comma-separated)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter cofounder names separated by commas
              </p>
            </div>

            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
                Logo Image URL (optional)
              </label>
              <input
                type="url"
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating Case Study...' : 'Generate Case Study'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-sm font-medium text-green-800">Success!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p><strong>Title:</strong> {result.data?.title}</p>
                <p><strong>Slug:</strong> {result.data?.slug}</p>
                <p><strong>ID:</strong> {result.data?.id}</p>
                <p><strong>Status:</strong> {result.data?.needs_review ? 'Needs Review' : 'Ready'}</p>
                <p><strong>Published:</strong> {result.data?.is_published ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}

          {bulkResult && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-sm font-medium text-green-800">Bulk Processing Complete!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p><strong>Total Processed:</strong> {bulkResult.data?.total}</p>
                <p><strong>Successful:</strong> {bulkResult.data?.successful}</p>
                <p><strong>Failed:</strong> {bulkResult.data?.failed}</p>
                
                {bulkResult.data?.results && bulkResult.data.results.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Results:</h4>
                    <div className="max-h-40 overflow-y-auto">
                      {bulkResult.data.results.map((result: any, index: number) => (
                        <div key={index} className={`text-xs p-2 rounded mb-1 ${
                          result.success ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {result.success ? (
                            <span className="text-green-800">
                              ✅ {result.personName} at {result.companyName} - {result.title}
                            </span>
                          ) : (
                            <span className="text-red-800">
                              ❌ {result.personName} at {result.companyName} - {result.error}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

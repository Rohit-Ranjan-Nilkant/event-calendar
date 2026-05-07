"use client"

import { useState, useRef } from "react"
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
} from "lucide-react"
import toast from "react-hot-toast"

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<{
    imported: number
    skipped: number
  } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload/excel", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      setResults(data)
      toast.success(`Successfully imported ${data.imported} events!`)
      setFile(null)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Upload failed"
      )
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = async () => {
    const res = await fetch("/api/template")
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "event-template.xlsx"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (
      droppedFile &&
      (droppedFile.name.endsWith(".xlsx") ||
        droppedFile.name.endsWith(".xls") ||
        droppedFile.name.endsWith(".csv"))
    ) {
      setFile(droppedFile)
    } else {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV file")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upload from File
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload an Excel or CSV file with your events
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download Template
        </button>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
            : file
              ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drop your file here or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supports .xlsx, .xls, and .csv files
            </p>
          </>
        )}
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? "Uploading..." : "Import Events"}
        </button>
      )}

      {results && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              Import Complete
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-400">
            {results.imported} events imported successfully
          </p>
          {results.skipped > 0 && (
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
              {results.skipped} rows skipped (missing required fields)
            </p>
          )}
        </div>
      )}
    </div>
  )
}

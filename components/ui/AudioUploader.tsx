"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AudioUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function AudioUploader({ value, onChange, disabled }: AudioUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onChange(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          ref={fileInputRef}
          accept="audio/*"
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="cursor-pointer"
        />
        {uploading && (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {value && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <audio controls className="h-8 flex-1">
            <source src={value} />
            Your browser does not support audio.
          </audio>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-red-600 hover:text-red-700 text-sm"
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Supported: mp3, wav, ogg, webm, m4a. Max size: 10MB
      </p>
    </div>
  );
}

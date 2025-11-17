"use client";

import { useState } from "react";

interface FormProps {
  onSubmit: (liAt: string, postUrl: string) => void;
  disabled: boolean;
}

export default function Form({ onSubmit, disabled }: FormProps) {
  const [liAt, setLiAt] = useState("");
  const [postUrl, setPostUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (liAt.trim() && postUrl.trim()) {
      onSubmit(liAt.trim(), postUrl.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="liAt" className="block text-sm font-medium mb-2">
          LinkedIn li_at Cookie
        </label>
        <textarea
          id="liAt"
          value={liAt}
          onChange={(e) => setLiAt(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
          rows={3}
          placeholder="Paste your LinkedIn li_at cookie value here"
        />
      </div>
      <div>
        <label htmlFor="postUrl" className="block text-sm font-medium mb-2">
          LinkedIn Post URL
        </label>
        <input
          type="url"
          id="postUrl"
          value={postUrl}
          onChange={(e) => setPostUrl(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="https://www.linkedin.com/posts/..."
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !liAt.trim() || !postUrl.trim()}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Start Scrape
      </button>
    </form>
  );
}


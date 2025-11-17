"use client";

import { APP_VERSION } from "@/app/version";

export default function Footer() {
  return (
    <footer className="mt-8 py-4 border-t border-gray-200 text-center text-sm text-gray-500">
      <div className="flex justify-center items-center gap-2">
        <span>Project Echo</span>
        <span>•</span>
        <span>Version {APP_VERSION}</span>
        <span>•</span>
        <span>{new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}


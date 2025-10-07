'use client';

import * as React from 'react';
import { useState } from 'react';
import { X } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UrlInputModalProps {
  isOpen: boolean;
  label: string;
  placeholder: string;
  onSubmit: (url: string) => void;
  onClose: () => void;
}

export function UrlInputModal({
  isOpen,
  label,
  placeholder,
  onSubmit,
  onClose,
}: UrlInputModalProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL (e.g., https://www.example.com)');
      return;
    }

    onSubmit(url);
    setUrl('');
  };

  const handleClose = () => {
    setUrl('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="bg-background relative z-10 w-full max-w-md rounded-2xl border p-6 shadow-lg">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground absolute top-4 right-4 transition-colors"
          aria-label="Close"
        >
          <X size={20} weight="bold" />
        </button>

        {/* Content */}
        <h2 className="mb-4 text-xl font-semibold">{label}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              placeholder={placeholder}
              className={cn(
                'bg-muted border-border focus:border-primary w-full rounded-lg border px-4 py-3 outline-none transition-colors',
                error && 'border-destructive focus:border-destructive'
              )}
              autoFocus
            />
            {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

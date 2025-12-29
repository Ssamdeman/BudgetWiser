"use client";

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordGateProps {
  onUnlock: () => void;
}

export function SubscriptionPasswordGate({ onUnlock }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarning(null);

    // Warning for short passwords (scare tactic, don't block)
    if (password.length < 8) {
      setWarning('Password should be 12-24 characters');
    }

    // Still attempt verification
    if (password.length < 6 || password.length > 64) {
      setError('Invalid password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        onUnlock();
      } else {
        setError('Incorrect password');
        setPassword('');
        inputRef.current?.focus();
      }
    } catch {
      setError('Verification failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="py-12 px-6">
        <div className="max-w-xs mx-auto">
          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-center mb-2">Protected Content</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter password to view subscriptions
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                ref={inputRef}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={isLoading}
                className={cn(
                  "h-12 text-base text-center",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
              />
            </div>

            {/* Warning (short password) */}
            {warning && !error && (
              <div className="flex items-center gap-2 text-amber-500 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>{warning}</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading || password.length === 0}
              className="w-full h-12 text-base"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Unlock'
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

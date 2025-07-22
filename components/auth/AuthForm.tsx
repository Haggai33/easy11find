// /components/auth/AuthForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signUpWithEmail } from '@/lib/authService';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const action = mode === 'login' ? signInWithEmail : signUpWithEmail;
    const { user, error } = await action(email, password);

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message || 'An error occurred.');
    } else if (user) {
      toast.success(mode === 'login' ? 'Logged in successfully!' : 'Account created successfully!');
      router.push('/dashboard');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === 'login' 
            ? 'Sign in to your account to continue' 
            : 'Create a new account to get started'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              disabled={isSubmitting}
              minLength={6}
            />
          </div>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          {mode === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
// /app/(auth)/signup/page.tsx
import AuthForm from '@/components/auth/AuthForm';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
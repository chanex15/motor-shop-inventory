import { Suspense } from 'react';
import LoginForm from '@/components/shared/LoginForm';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Suspense fallback={<LoadingSpinner />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

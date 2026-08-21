'use client';

import { useUser } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useOnboardingStatus } from '@/hooks/useApi';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children, mode = 'dashboard' }) {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const { data: statusData, isLoading: isStatusLoading } = useOnboardingStatus({
    enabled: Boolean(isLoaded && isSignedIn),
  });

  const onboardingCompleted = statusData?.data?.onboardingCompleted;

  useEffect(() => {
    if (!isLoaded || isStatusLoading) return;

    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }

    if (mode === 'dashboard' && onboardingCompleted === false) {
      router.replace('/onboarding/business-info');
    } else if (mode === 'onboarding' && onboardingCompleted === true) {
      router.replace('/restaurant');
    }
  }, [isLoaded, isSignedIn, onboardingCompleted, mode, isStatusLoading, router]);

  if (!isLoaded || (isSignedIn && isStatusLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-xs text-muted-foreground">Verifying account & setup status...</p>
      </div>
    );
  }

  if (mode === 'dashboard' && onboardingCompleted === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-xs text-muted-foreground">Redirecting to setup...</p>
      </div>
    );
  }

  if (mode === 'onboarding' && onboardingCompleted === true) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-xs text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return children;
}

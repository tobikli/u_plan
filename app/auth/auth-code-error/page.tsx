"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, ReadonlyURLSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AuthErrorState = {
  error?: string;
  error_code?: string;
  error_description?: string;
  provider?: string;
};

// Extract a plain object from URLSearchParams so it can be displayed.
function extractParams(params: URLSearchParams | ReadonlyURLSearchParams): AuthErrorState {
  return {
    error: params.get("error") ?? undefined,
    error_code: params.get("error_code") ?? undefined,
    error_description: params.get("error_description") ?? undefined,
    provider: params.get("provider") ?? undefined,
  };
}

export default function AuthCodeErrorPage() {
  const queryParams = useSearchParams();
  const [hashParams, setHashParams] = useState<AuthErrorState>({});

  // Parse any parameters contained in the URL hash (Supabase returns OAuth errors here).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    const parsed = extractParams(new URLSearchParams(hash));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHashParams(parsed);
  }, []);

  // Merge query params (server-provided) with hash params (client-only).
  const merged = useMemo<AuthErrorState>(() => {
    const parsedQuery = queryParams ? extractParams(queryParams) : {};
    return { ...parsedQuery, ...hashParams };
  }, [hashParams, queryParams]);

  const hasDetails = merged.error || merged.error_description || merged.error_code || merged.provider;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Authentication error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {hasDetails ? (
                <>
                  {merged.error && <p><span className="font-medium text-foreground">Error:</span> {merged.error}</p>}
                  {merged.error_code && <p><span className="font-medium text-foreground">Code:</span> {merged.error_code}</p>}
                  {merged.error_description && <p><span className="font-medium text-foreground">Details:</span> {merged.error_description}</p>}
                  {merged.provider && <p><span className="font-medium text-foreground">Provider:</span> {merged.provider}</p>}
                </>
              ) : (
                <p>No additional information was provided.</p>
              )}
              <div className="pt-2">
                <Button asChild className="w-full">
                  <Link href="/auth/login">Back to login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

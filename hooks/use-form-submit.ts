import { useState, useCallback } from "react";

/**
 * State for form submission handling
 */
interface FormState {
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Options for form submission
 */
interface UseFormOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for handling form submission with loading and error states.
 * This follows the Hook pattern to encapsulate form submission logic.
 * 
 * @template T - The type of data returned on successful submission
 * @param submitFn - The async function to call when the form is submitted (receives FormData)
 * @param options - Optional callbacks for success and error handling
 * @returns Form state and submission handler
 * 
 * @example
 * ```tsx
 * const { isSubmitting, error, handleSubmit } = useFormSubmit(
 *   async (formData) => {
 *     const name = formData.get('name');
 *     const result = await api.createUser({ name });
 *     return result;
 *   },
 *   {
 *     onSuccess: (data) => router.push('/success'),
 *     onError: (error) => toast.error(error.message)
 *   }
 * );
 * ```
 */
export function useFormSubmit<T = unknown>(
  submitFn: (data: FormData) => Promise<T>,
  options: UseFormOptions<T> = {}
) {
  const [state, setState] = useState<FormState>({
    isSubmitting: false,
    error: null,
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setState({ isSubmitting: true, error: null });

      try {
        const formData = new FormData(e.currentTarget);
        const result = await submitFn(formData);
        
        setState({ isSubmitting: false, error: null });
        options.onSuccess?.(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        setState({ isSubmitting: false, error: errorMessage });
        options.onError?.(error as Error);
      }
    },
    [submitFn, options]
  );

  const reset = useCallback(() => {
    setState({ isSubmitting: false, error: null });
  }, []);

  return {
    isSubmitting: state.isSubmitting,
    error: state.error,
    handleSubmit,
    reset,
  };
}

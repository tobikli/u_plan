import { UpdatePasswordForm } from "@/components/update-password-form";
import { ModeToggle } from "@/components/theme-toggle";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="fixed top-5 right-5 z-50">
        <ModeToggle />
      </div>
      <div className="w-full max-w-sm">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}

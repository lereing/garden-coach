import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast-provider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

import type { ReactNode } from "react";
import { EmptyState } from "../../../components/ui/EmptyState";

interface DashboardEmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

// Fina camada sobre o `EmptyState` do design system — só padroniza o texto
// pras seções do dashboard, sem reimplementar nada.
export function DashboardEmptyState({ title, description, action }: DashboardEmptyStateProps) {
  return <EmptyState title={title} description={description} action={action} />;
}

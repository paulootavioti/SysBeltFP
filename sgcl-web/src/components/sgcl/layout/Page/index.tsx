import type { ReactNode } from "react";

import { Layout } from "../../../layout/Layout";

import "./styles.css";

interface PageProps {
  children: ReactNode;
}

export function Page({ children }: PageProps) {
  return (
    <Layout>
      <div className="sgcl-page">
        {children}
      </div>
    </Layout>
  );
}

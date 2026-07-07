import type { ReactNode } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import "./styles.css";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({
  children,
}: LayoutProps) {

  const { usuario, logout } =
    useAuth();

  
  const navigate = useNavigate();  
  function handleLogout() {
    logout();
    navigate("/");
  }
  
  return (

    
    <div className="layout">
    

      <aside className="sidebar">

        <h2>SGCL Kids</h2>

        <hr />

        <Link to="/dashboard">
          🏠 Dashboard
        </Link>

        <Link to="/alunos">
          👦 Alunos
        </Link>

        <Link to="/aulas">
          📅 Aulas
        </Link>

        <Link to="/mensalidades">
          💰 Mensalidades
        </Link>

        <Link to="/graduacoes">
          🥋 Graduações
        </Link>

        <Link to="/graduacoes/proximas">
          ⭐ Próximas Promoções
        </Link>

        <Link to="/usuarios">
          👤 Usuários
        </Link>

        <Link to="/competicoes">
          🏆 Competições
        </Link>

        <Link to="/relatorios">
          📈 Relatórios
        </Link>

        <Link to="/financeiro">
          📊 Financeiro
        </Link>

      </aside>

      <main className="content">

        <header className="header">

          <strong>
            {usuario?.nome}
          </strong>

          <Button onClick={handleLogout}>
            Sair
          </Button>

        </header>

        <div className="page">
          {children}
        </div>

      </main>

    </div>

  );

}
import { useEffect, useState } from "react";
import type { FormaPagamento } from "../types";
import { FormaPagamentoService } from "../services/FormaPagamentoService";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

export function useFormasPagamento() {
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarFormasPagamento() {
    try {
      setLoading(true);
      setErro("");
      const data = await FormaPagamentoService.listar();
      setFormasPagamento(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar formas de pagamento."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarFormasPagamento();
  }, []);

  return {
    formasPagamento,
    setFormasPagamento,
    loading,
    erro,
    setErro,
    carregarFormasPagamento,
  };
}

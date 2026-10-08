import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";

type FormatoMatriz = "csv" | "xls" | "pdf";

export function validarFormatoMatriz(valor: unknown): FormatoMatriz {
  if (valor === "csv" || valor === "xls" || valor === "pdf") return valor;
  throw new Error("Formato inválido. Use CSV, XLS ou PDF.");
}

export function gerarArquivoMatriz(matriz: Record<string, unknown>, formato: FormatoMatriz): Promise<Buffer> | Buffer {
  if (formato === "pdf") return gerarPdf(matriz);

  const planilha = XLSX.utils.json_to_sheet([{ schema: "sysbelt-matriz-planejamento", versao: 1, matriz: JSON.stringify(matriz) }]);
  if (formato === "csv") return Buffer.from(XLSX.utils.sheet_to_csv(planilha), "utf8");
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, "Matriz");
  return XLSX.write(livro, { type: "buffer", bookType: "xls" });
}

export function lerArquivoMatriz(buffer: Buffer) {
  const livro = XLSX.read(buffer, { type: "buffer" });
  const primeiraAba = livro.Sheets[livro.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<{ schema?: string; versao?: number; matriz?: string }>(primeiraAba, { defval: "" });
  const linha = linhas[0];
  if (!linha?.matriz) throw new Error("O arquivo não contém uma matriz de planejamentos válida.");
  return {
    schema: linha.schema || "sysbelt-matriz-planejamento",
    versao: Number(linha.versao) || 1,
    matriz: JSON.parse(linha.matriz),
  };
}

function gerarPdf(arquivo: Record<string, any>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ margin: 42, size: "A4" });
    const partes: Buffer[] = [];
    pdf.on("data", (parte) => partes.push(parte));
    pdf.on("end", () => resolve(Buffer.concat(partes)));
    pdf.on("error", reject);
    pdf.fontSize(18).text(arquivo.matriz?.nome ?? "Matriz de planejamentos");
    pdf.moveDown().fontSize(10).text(`Exportado em ${new Date().toLocaleString("pt-BR")}`);
    for (const curriculo of arquivo.matriz?.curriculos ?? []) {
      pdf.moveDown().fontSize(14).text(curriculo.nome);
      pdf.fontSize(10).text(`${curriculo.modalidadeNome ?? "Sem modalidade"} | ${curriculo.publico ?? ""}`);
      for (const modulo of curriculo.modulos ?? []) {
        pdf.moveDown(0.5).fontSize(11).text(`Módulo: ${modulo.nome}`);
        for (const aula of modulo.aulas ?? []) pdf.fontSize(9).text(`• ${aula.titulo}${aula.duracaoMinutos ? ` (${aula.duracaoMinutos} min)` : ""}`);
      }
    }
    pdf.end();
  });
}

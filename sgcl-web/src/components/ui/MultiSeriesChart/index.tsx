import { useId, useState } from "react";
import "./styles.css";

export interface PontoMultiSerie {
  label: string;
}

export interface SerieBarra {
  chave: string;
  rotulo: string;
  cor?: string;
}

export interface SerieLinha {
  chave: string;
  rotulo: string;
  cor?: string;
  formatarValor?: (valor: number) => string;
}

interface MultiSeriesChartProps<T extends PontoMultiSerie> {
  titulo: string;
  subtitulo?: string;
  dados: T[];
  barras: SerieBarra[];
  // A série de linha é sempre lida como percentual (0-100) num eixo
  // secundário à direita — cobre o caso de uso atual (taxa de frequência
  // sobre presenças/faltas). Não é um segundo eixo genérico.
  linha?: SerieLinha;
  formatarValor?: (valor: number) => string;
}

function lerValor<T extends PontoMultiSerie>(ponto: T, chave: string): number {
  return Number((ponto as unknown as Record<string, unknown>)[chave]) || 0;
}

const LARGURA = 800;
const ALTURA = 320;
const MARGEM = { topo: 40, direita: 48, baixo: 32, esquerda: 56 };
const CORES_PADRAO = [
  "var(--color-accent)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-danger)",
];

function arredondarParaCima(valor: number): number {
  if (valor <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(valor));
  const normalizado = valor / magnitude;

  let alvo = 10;
  if (normalizado <= 1) alvo = 1;
  else if (normalizado <= 2) alvo = 2;
  else if (normalizado <= 5) alvo = 5;

  return alvo * magnitude;
}

function formatarPadrao(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

export function MultiSeriesChart<T extends PontoMultiSerie>({
  titulo,
  subtitulo,
  dados,
  barras,
  linha,
  formatarValor = formatarPadrao,
}: MultiSeriesChartProps<T>) {
  const idBase = useId();
  const [indiceAtivo, setIndiceAtivo] = useState<number | null>(null);
  const [mostrarTabela, setMostrarTabela] = useState(false);

  const larguraPlot = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const alturaPlot = ALTURA - MARGEM.topo - MARGEM.baixo;

  const valorMaximoBruto = Math.max(
    0,
    ...dados.flatMap((ponto) => barras.map((serie) => lerValor(ponto, serie.chave)))
  );
  const valorMaximoEixo = arredondarParaCima(valorMaximoBruto || 1);
  const temDados = dados.length > 0 && valorMaximoBruto > 0;

  const larguraBanda = dados.length > 0 ? larguraPlot / dados.length : larguraPlot;
  const larguraGrupo = larguraBanda * 0.72;
  const larguraBarra = barras.length > 0 ? larguraGrupo / barras.length : larguraGrupo;

  const LIMITE_ROTULOS_X = 10;
  const passoRotulo = Math.max(1, Math.ceil(dados.length / LIMITE_ROTULOS_X));

  function y(valor: number) {
    return MARGEM.topo + alturaPlot - (valor / valorMaximoEixo) * alturaPlot;
  }

  function yPercentual(valor: number) {
    return MARGEM.topo + alturaPlot - (Math.min(100, Math.max(0, valor)) / 100) * alturaPlot;
  }

  const ticksEixoY = [0, valorMaximoEixo / 2, valorMaximoEixo];

  const pontosLinha = linha
    ? dados.map((ponto, indice) => {
        const xBanda = MARGEM.esquerda + indice * larguraBanda;
        return { x: xBanda + larguraBanda / 2, y: yPercentual(lerValor(ponto, linha.chave)) };
      })
    : [];

  const caminhoLinha = pontosLinha.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");

  return (
    <div className="multi-series-chart-card">
      <div className="multi-series-chart-cabecalho">
        <div>
          <h3>{titulo}</h3>
          {subtitulo && <p>{subtitulo}</p>}
        </div>
        <button
          type="button"
          className="multi-series-chart-toggle-tabela"
          onClick={() => setMostrarTabela((atual) => !atual)}
        >
          {mostrarTabela ? "Ver gráfico" : "Ver como tabela"}
        </button>
      </div>

      <div className="multi-series-chart-legenda" role="list" aria-label="Legenda do gráfico">
        {barras.map((serie, indice) => (
          <span key={serie.chave} role="listitem" className="multi-series-chart-legenda-item">
            <span
              className="multi-series-chart-legenda-cor"
              style={{ background: serie.cor ?? CORES_PADRAO[indice % CORES_PADRAO.length] }}
            />
            {serie.rotulo}
          </span>
        ))}
        {linha && (
          <span role="listitem" className="multi-series-chart-legenda-item">
            <span
              className="multi-series-chart-legenda-linha"
              style={{ background: linha.cor ?? "var(--color-secondary)" }}
            />
            {linha.rotulo}
          </span>
        )}
      </div>

      {mostrarTabela ? (
        <div className="multi-series-chart-tabela-wrapper">
          <table className="multi-series-chart-tabela">
            <thead>
              <tr>
                <th>Período</th>
                {barras.map((serie) => (
                  <th key={serie.chave}>{serie.rotulo}</th>
                ))}
                {linha && <th>{linha.rotulo}</th>}
              </tr>
            </thead>
            <tbody>
              {dados.map((ponto) => (
                <tr key={ponto.label}>
                  <td>{ponto.label}</td>
                  {barras.map((serie) => (
                    <td key={serie.chave}>{formatarValor(lerValor(ponto, serie.chave))}</td>
                  ))}
                  {linha && (
                    <td>
                      {(linha.formatarValor ?? formatarValor)(lerValor(ponto, linha.chave))}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !temDados ? (
        <p className="multi-series-chart-vazio">Sem dados neste período.</p>
      ) : (
        <div className="multi-series-chart-svg-wrapper">
          <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} className="multi-series-chart-svg" role="img" aria-label={titulo}>
            {ticksEixoY.map((tick) => (
              <g key={tick}>
                <line
                  x1={MARGEM.esquerda}
                  x2={LARGURA - MARGEM.direita}
                  y1={y(tick)}
                  y2={y(tick)}
                  className="multi-series-chart-grid"
                />
                <text x={MARGEM.esquerda - 8} y={y(tick)} className="multi-series-chart-eixo-y" textAnchor="end" dy="0.32em">
                  {formatarValor(Math.round(tick))}
                </text>
              </g>
            ))}

            {linha && (
              <>
                {[0, 50, 100].map((tick) => (
                  <text
                    key={tick}
                    x={LARGURA - MARGEM.direita + 8}
                    y={yPercentual(tick)}
                    className="multi-series-chart-eixo-y-secundario"
                    textAnchor="start"
                    dy="0.32em"
                  >
                    {tick}%
                  </text>
                ))}
              </>
            )}

            {dados.map((ponto, indice) => {
              const xBanda = MARGEM.esquerda + indice * larguraBanda;
              const inicioGrupo = xBanda + (larguraBanda - larguraGrupo) / 2;
              const ativo = indiceAtivo === indice;

              return (
                <g key={`${idBase}-${ponto.label}`}>
                  <rect
                    x={xBanda}
                    y={MARGEM.topo}
                    width={larguraBanda}
                    height={alturaPlot}
                    fill="transparent"
                    tabIndex={0}
                    role="button"
                    aria-label={`${ponto.label}: ${barras
                      .map((serie) => `${serie.rotulo} ${formatarValor(lerValor(ponto, serie.chave))}`)
                      .join(", ")}`}
                    onMouseEnter={() => setIndiceAtivo(indice)}
                    onMouseLeave={() => setIndiceAtivo(null)}
                    onFocus={() => setIndiceAtivo(indice)}
                    onBlur={() => setIndiceAtivo(null)}
                    className="multi-series-chart-hit"
                  />

                  {barras.map((serie, indiceSerie) => {
                    const valor = lerValor(ponto, serie.chave);
                    const xBarra = inicioGrupo + indiceSerie * larguraBarra;
                    const topo = y(valor);
                    const base = MARGEM.topo + alturaPlot;
                    const altura = Math.max(0, base - topo);

                    return (
                      <rect
                        key={serie.chave}
                        x={xBarra}
                        y={topo}
                        width={Math.max(1, larguraBarra - 2)}
                        height={altura}
                        rx={2}
                        pointerEvents="none"
                        fill={serie.cor ?? CORES_PADRAO[indiceSerie % CORES_PADRAO.length]}
                        opacity={ativo ? 1 : 0.9}
                      />
                    );
                  })}

                  {(indice % passoRotulo === 0 || indice === dados.length - 1) && (
                    <text
                      x={xBanda + larguraBanda / 2}
                      y={ALTURA - MARGEM.baixo + 18}
                      textAnchor="middle"
                      className="multi-series-chart-eixo-x"
                    >
                      {ponto.label}
                    </text>
                  )}
                </g>
              );
            })}

            {linha && pontosLinha.length > 1 && (
              <path d={caminhoLinha} className="multi-series-chart-linha" fill="none" pointerEvents="none" />
            )}

            {linha &&
              pontosLinha.map((p, indice) => (
                <circle
                  key={`ponto-linha-${indice}`}
                  cx={p.x}
                  cy={p.y}
                  r={indiceAtivo === indice ? 4 : 3}
                  className="multi-series-chart-ponto-linha"
                  pointerEvents="none"
                />
              ))}
          </svg>

          {indiceAtivo !== null && (
            <div
              className="multi-series-chart-tooltip"
              style={{
                left: `${((MARGEM.esquerda + indiceAtivo * larguraBanda + larguraBanda / 2) / LARGURA) * 100}%`,
                top: `${(MARGEM.topo / ALTURA) * 100}%`,
              }}
            >
              <strong>{dados[indiceAtivo].label}</strong>
              {barras.map((serie) => (
                <span key={serie.chave}>
                  {serie.rotulo}: {formatarValor(lerValor(dados[indiceAtivo], serie.chave))}
                </span>
              ))}
              {linha && (
                <span>
                  {linha.rotulo}:{" "}
                  {(linha.formatarValor ?? formatarValor)(lerValor(dados[indiceAtivo], linha.chave))}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

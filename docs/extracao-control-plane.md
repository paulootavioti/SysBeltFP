# Extração do Control Plane

O Control Plane foi preparado para operar no repositório independente
[`paulootavioti/control-plane`](https://github.com/paulootavioti/control-plane).
Seu histórico foi preservado com `git subtree split`; os contratos HTTP
versionados permanecem neste repositório porque o SysBelt continua sendo um
consumidor dessas interfaces.

## O que permanece no SysBelt

- cliente do diretório de tenants;
- emissão dos snapshots agregados de uso;
- recepção e validação de concessões assinadas;
- chave pública de concessões e URL do Control Plane;
- contratos versionados em `contracts/`.

## Operação

CI, build, migrations e deploy do Control Plane pertencem ao repositório
independente. A remoção deste diretório não altera o banco do Control Plane nem
a URL consumida pelo SysBelt. O corte de produção deve ocorrer antes do merge
da remoção, seguindo `docs/CORTE-CONTROL-PLANE.md` no novo repositório.

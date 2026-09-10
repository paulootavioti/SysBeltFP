import { describe, expect, it, vi } from "vitest";
import { DiretorioControlPlane, DiretorioIndisponivelError, slugDoHostname, slugDoMapaDeHosts } from "./DiretorioControlPlane";

const tenant = { schemaVersion:"1.0",tenantKey:"64d729dc-8cbc-4fbf-9259-f28809faf55d",produto:"sysbelt",slug:"academia-centro",
  status:"ATIVO",acesso:{administrativo:"LIBERADO",clinico:"LIBERADO"},secretRef:"cofre/ref",tenantSchemaVersion:"3.0.2026.09.01",credentialVersion:1 };
const resposta = (status:number, corpo:unknown={}) => ({ status, ok:status>=200&&status<300, json:vi.fn().mockResolvedValue(corpo) }) as unknown as Response;

describe("diretório multiproduto SysBelt",()=>{
  it("usa Bearer/versionamento e cacheia ativo por 60 segundos",async()=>{let agora=0;const fetchFn=vi.fn().mockResolvedValue(resposta(200,tenant));const cliente=new DiretorioControlPlane("https://control.test","credencial","v1",fetchFn,()=>agora);
    expect(await cliente.resolver("academia-centro")).toEqual(tenant);agora=59_999;await cliente.resolver("academia-centro");expect(fetchFn).toHaveBeenCalledOnce();
    const [url,opcoes]=fetchFn.mock.calls[0];expect(String(url)).toBe("https://control.test/api/diretorio/v1/produtos/sysbelt/tenants/academia-centro");expect(opcoes.headers).toMatchObject({authorization:"Bearer credencial","x-control-plane-credential-version":"v1"});});
  it("cacheia 404 por cinco segundos e não cacheia 401",async()=>{let agora=0;const fetch404=vi.fn().mockResolvedValue(resposta(404));const negativo=new DiretorioControlPlane("https://control.test","credencial","v1",fetch404,()=>agora);expect(await negativo.resolver("ausente")).toBeNull();await negativo.resolver("ausente");expect(fetch404).toHaveBeenCalledOnce();
    const fetch401=vi.fn().mockResolvedValue(resposta(401));const recusado=new DiretorioControlPlane("https://control.test","credencial","v1",fetch401);await expect(recusado.resolver("academia")).rejects.toBeInstanceOf(DiretorioIndisponivelError);await expect(recusado.resolver("academia")).rejects.toBeInstanceOf(DiretorioIndisponivelError);expect(fetch401).toHaveBeenCalledTimes(2);});
  it("extrai somente slug de domínio autorizado",()=>{expect(slugDoHostname("Academia-Centro.app.sysbelt.com.br",["app.sysbelt.com.br"])).toBe("academia-centro");expect(slugDoHostname("app.sysbelt.com.br",["app.sysbelt.com.br"])).toBeNull();expect(slugDoHostname("academia.outro.test",["app.sysbelt.com.br"])).toBeNull();});
  it("mapeia exatamente o host gratuito do Netlify",()=>{const mapa=JSON.stringify({"sysbeltfp.netlify.app":"academia-centro"});expect(slugDoMapaDeHosts("SYSBELTFP.NETLIFY.APP",mapa)).toBe("academia-centro");expect(slugDoMapaDeHosts("outro.netlify.app",mapa)).toBeNull();});
  it("falha fechado quando o mapa de hosts é inválido",()=>{expect(()=>slugDoMapaDeHosts("sysbeltfp.netlify.app",'{"sysbeltfp.netlify.app":"Slug Inválido"}')).toThrow("SYSBELT_TENANT_HOST_MAP_INVALIDO");});
});

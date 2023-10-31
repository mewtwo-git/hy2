import axios from "axios";
import { lookup } from "dns/promises";
import * as fs from "fs";
import { writeFileSync } from "fs-extra";
import yaml from "yaml";

const yamlObj: {
  proxies: any[];
} = {
  proxies: [],
};

const getUrlRaw = async (url: string): Promise<any> => {
  const resp = await axios.get(url);
  return resp.data;
};

const main = async (urls: string[]) => {
  const promises = urls.map((url) => getUrlRaw(url));
  const resps = await Promise.all(promises);
  for (let index = 0; index < resps.length; index++) {
    const resp: {
      server: string;
      auth: string;
      tls: {
        sni: string;
        insecure: boolean;
      };
    } = resps[index];
    const [host, port] = resp.server.split(":");
    const { address } = await lookup(host);
    const result: { country_code: string } = await getUrlRaw(
      "https://api.ip.sb/geoip/" + address
    );
    yamlObj.proxies.push({
      name: `${result.country_code}_${index} - hy2`,
      type: "hysteria2",
      server: host,
      port: Number(port),
      up: 50,
      down: 500,
      password: resp.auth,
      sni: resp.tls.sni,
      "skip-cert-verify": resp.tls.insecure,
    });
  }

  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist");
  }
  writeFileSync("dist/chromego.yaml", yaml.stringify(yamlObj));
};

(async () => {
  await main([
    "https://www.githubip.xyz/Alvin9999/pac2/master/hysteria2/config.json",
    "https://www.githubip.xyz/Alvin9999/pac2/master/hysteria2/2/config.json",
    "https://www.gitlabip.xyz/Alvin9999/pac2/master/hysteria2/1/config.json",
    "https://www.gitlabip.xyz/Alvin9999/pac2/master/hysteria2/13/config.json",
  ]);
})();

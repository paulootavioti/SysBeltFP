import { getStore } from "@netlify/blobs";

export function getFotosStore() {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;

  if (siteID && token) {
    return getStore({ name: "fotos", siteID, token });
  }

  return getStore("fotos");
}

const CLEAN_VERSION = "p900-launch-complete-2026-09-29";

function transform(html) {
  return html
    .replaceAll("./launch-hardening.css?v=p900-launch-complete-2026-09-29", "./launch-hardening.css?v="+CLEAN_VERSION)
    .replaceAll("./launch-hardening.js?v=p900-launch-complete-2026-09-29", "./launch-hardening.js?v="+CLEAN_VERSION)
    .replaceAll("const DINLIMINATE_VERSION = 'p900-launch-complete-2026-09-29';", "const DINLIMINATE_VERSION = '"+CLEAN_VERSION+"';")
    .replaceAll("const V='p623';", "const V='"+CLEAN_VERSION+"';")
    .replace("</head>", '<link rel="stylesheet" href="./p636-clean-ui.css?v='+CLEAN_VERSION+'"></head>')
    .replace("<body>", '<body data-dinliminate-release="'+CLEAN_VERSION+'">');
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.status(405).setHeader("allow", "GET, HEAD").send("Method not allowed");
    return;
  }
  const host = req.headers.host;
  if (!host) { res.status(500).send("Missing host header"); return; }
  try {
    const upstream = await fetch("https://"+host+"/index.html", {headers:{accept:"text/html"}});
    if (!upstream.ok) { res.status(upstream.status).send("Dinliminate app entry unavailable"); return; }
    const html = transform(await upstream.text());
    res.status(200);
    res.setHeader("content-type","text/html; charset=utf-8");
    res.setHeader("cache-control","no-store, max-age=0");
    res.setHeader("x-dinliminate-release", CLEAN_VERSION);
    res.send(html);
  } catch (error) {
    console.error("clean-entry", error);
    res.status(503).send("Dinliminate could not load the app entry.");
  }
}

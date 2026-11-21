# Static demo (GitHub Pages)

A read-only copy of the public site with the real content, at
https://stijndh88.github.io/DAPV/. Built by `.github/workflows/pages-demo.yml`:

1. a throwaway PostgreSQL, `pnpm migrate` and the WordPress importer (`migration/data`);
2. `pnpm build` and `pnpm start` of the real app;
3. `demo/snapshot.mjs` crawls every public page from `/`, saves it as plain HTML under the
   repo's sub-path, follows old-URL redirects and turns `?seizoen=2023` pages into folders;
4. the result is deployed to Pages.

The public pages have no client-side JavaScript, so the Next.js runtime is left out.
Not in the demo: `/admin` (the CMS needs a server and a database), previews and the API.
Every page has a demo banner and `noindex`, so it does not compete with plasvissers.be in search.

Try it locally with the app running on port 3000:

```bash
node demo/snapshot.mjs --origin http://localhost:3000 --base /DAPV --out /tmp/demo
mkdir -p /tmp/serve && ln -sfn /tmp/demo /tmp/serve/DAPV && python3 -m http.server -d /tmp/serve 8080
# open http://localhost:8080/DAPV/
```

One-time setup in GitHub: Settings → Pages → Source: **GitHub Actions**.

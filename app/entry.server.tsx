// entry.server.tsx
import { renderToReadableStream, renderToString } from 'react-dom/server'
import { CacheProvider } from '@emotion/react'
import createEmotionServer from '@emotion/server/create-instance'
import { RemixServer } from '@remix-run/react'
import type { EntryContext } from '@remix-run/cloudflare' // Depends on the runtime you choose
import { isbot } from "isbot";

import { ServerStyleContext } from './context'
import createEmotionCache from './createEmotionCache'

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  // const html = renderToString(
  //   <ServerStyleContext.Provider value={null}>
  //     <CacheProvider value={cache}>
  //       <RemixServer context={remixContext} url={request.url} />
  //     </CacheProvider>
  //   </ServerStyleContext.Provider>,
  // );

  // const chunks = extractCriticalToChunks(html);

  // const markup = renderToString(
  //   <ServerStyleContext.Provider value={chunks.styles}>
  //     <CacheProvider value={cache}>
  //       <RemixServer context={remixContext} url={request.url} />
  //     </CacheProvider>
  //   </ServerStyleContext.Provider>,
  // );

  // responseHeaders.set('Content-Type', 'text/html');

  // return new Response(`<!DOCTYPE html>${markup}`, {
  //   status: responseStatusCode,
  //   headers: responseHeaders,
  // });

  const body = await renderToReadableStream(
    <ServerStyleContext.Provider value={null}>
      <CacheProvider value={cache}>
        <RemixServer context={remixContext} url={request.url} />
      </CacheProvider>
    </ServerStyleContext.Provider>,
    {
      signal: request.signal,
      onError(error: unknown) {
        // Log streaming rendering errors from inside the shell
        console.error(error);
        responseStatusCode = 500;
      },
    }
  );

  if (isbot(request.headers.get("user-agent") || "")) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });

}

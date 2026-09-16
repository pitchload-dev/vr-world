import { env } from 'cloudflare:workers';
import {
  loadPitchload,
  eventPlaylist,
  type ExhibitionContent,
} from '@/lib/pitchload';
let cache: { expires: number; data: ExhibitionContent } | undefined;
let inFlight: Promise<ExhibitionContent> | undefined;
export async function GET() {
  const runtime = env as Record<string, unknown>;
  const key =
    typeof runtime.PITCHLOAD_API_KEY === 'string'
      ? runtime.PITCHLOAD_API_KEY
      : undefined;
  if (!key)
    return Response.json(await loadPitchload(undefined), {
      headers: { 'Cache-Control': 'no-store' },
    });
  if (cache && cache.expires > Date.now())
    return Response.json(cache.data, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  inFlight ??= loadPitchload(
    key,
    typeof runtime.PITCHLOAD_PLAYLIST_ID === 'string'
      ? runtime.PITCHLOAD_PLAYLIST_ID
      : eventPlaylist,
  );
  try {
    const data = await inFlight;
    cache = {
      expires: Date.now() + (data.source === 'preview' ? 30000 : 300000),
      data,
    };
    return Response.json(data, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } finally {
    inFlight = undefined;
  }
}

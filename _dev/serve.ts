import { serve } from "https://deno.land/std@0.173.0/http/mod.ts";
import { serveDir } from "https://deno.land/std@0.173.0/http/file_server.ts";

serve((req) => serveDir(req, { enableCors: true }));

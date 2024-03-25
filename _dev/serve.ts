import { serve } from "https://deno.land/std@0.220.1/http/mod.ts";
import { serveDir } from "https://deno.land/std@0.220.1/http/file_server.ts";

serve((req) => serveDir(req, { enableCors: true }));

# gbfs-map

https://deno.land/x/gbfs_map

A library for displaying GBFS port data on a map.

![image](https://user-images.githubusercontent.com/40050810/205360212-db4960f5-4a79-4c19-abe6-f92ce02e0feb.png)

> **Note** This library is compatible with GBFS version 2.3.

You can embed the GBFS portmap into your website using code like the one below.

```html
<script src="https://deno.land/x/gbfs_map/mod.js" charset="utf-8" type="module"></script>
<gbfs-map
    x-url="https://api-public.odpt.org/api/v4/gbfs/hellocycling/gbfs.json,https://api-public.odpt.org/api/v4/gbfs/docomo-cycle-tokyo/gbfs.json"
    x-default-lat="35.68123355100922"
    x-default-lon="139.76712357086677"
    x-preferred-languages="ja"
    x-cors
></gbfs-map>
```

See https://github.com/MobilityData/gbfs/blob/master/systems.csv for available
API endpoints.

## Link

- [Demo Site](https://gbfs-map-demo.deno.dev/)
- [Library](https://deno.land/x/gbfs_map)
- [Library document](https://deno.land/x/gbfs_map/mod.js?s=GbfsMap)

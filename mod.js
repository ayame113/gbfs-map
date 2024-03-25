// @ts-check
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="esnext" />

import * as L from "https://esm.sh/leaflet@1.9.4/";
const leafletUrl = "https://esm.sh/leaflet@1.9.4/";

// default icon
const blueIcon = L.icon({
  iconUrl: `${leafletUrl}dist/images/marker-icon.png`,
  iconRetinaUrl: `${leafletUrl}dist/images/marker-icon-2x.png`,
  shadowUrl: `${leafletUrl}dist/images/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const styleText = `
.leaflet-marker-icon.icon-custum {
  background-color: white;
  border-radius: 5px;
  border: 3px solid white;
}
:host {
  height: 300px; /* default height */
  display: block;
  position: relative;
}
:host>div {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
:host>section {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 9999;
  background-color: white;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-size: 90%;
}
:host>section label {
  display: block;
  padding: 4px 2px;
  margin: 0;
  cursor: pointer;
  font-family: "Helvetica Neue", Arial, Helvetica, "Hiragino Sans", "Yu Gothic", sans-serif;
  font-weight: bold;
  user-select: none;
}
:host>section label:hover {
  background-color: rgb(244, 244, 244);
}
:host>section label:first-child {
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}
:host>section label:has(:checked) {
  background-color: darkturquoise;
  color: white;
}
:host>section input {
  cursor: pointer;
}
.available {
  display: inline-block;
  background-color: mediumseagreen;
  color: white;
  font-size: 0.8em;
  font-weight: bold;
  border-radius: 0.2em;
  padding: 0.1em 0.2em;
  margin: 0.1em 0.2em;
  line-height: 1.5em;
}
.unavailable {
  display: inline-block;
  background-color: crimson;
  color: white;
  font-size: 0.8em;
  font-weight: bold;
  border-radius: 0.2em;
  padding: 0.1em 0.2em;
  margin: 0.1em 0.2em;
  line-height: 1.5em;
}
`;

// init stylesheet
const defaultStyle = new CSSStyleSheet();
defaultStyle.replace(styleText);
const leafletStyle = new CSSStyleSheet();
(async () => { // avoid tla
  const res = await fetch(`${leafletUrl}dist/leaflet.css`);
  leafletStyle.replace(await res.text());
})();

/**
 * Elements for GBFS data.
 * **This library is compatible with GBFS version 2.3.**
 *
 * ```html
 * <script src="https://deno.land/x/gbfs_map/mod.js" charset="utf-8" type="module"></script>
 * <gbfs-map
 *   x-url="https://api-public.odpt.org/api/v4/gbfs/hellocycling/gbfs.json,https://api-public.odpt.org/api/v4/gbfs/docomo-cycle-tokyo/gbfs.json"
 *   x-default-lat="35.68123355100922"
 *   x-default-lon="139.76712357086677"
 *   x-preferred-languages="ja"
 *   x-cors
 * ></gbfs-map>
 * ```
 *
 * You can specify the following attributes to control the display.
 * - `x-url`: endpoint for `gbfs.json`. You can specify multiple options by separating them with commas. See https://github.com/MobilityData/gbfs/blob/master/systems.csv for available API endpoints.
 * - `x-default-lat`: Initial coordinates of the map (latitude).
 * - `x-default-lon`: Initial coordinates of the map (longitude).
 * - `x-preferred-languages`: Language you want to display. If the API does not return data for that language, it will fallback to the first value returned by the API. You can specify multiple options by separating them with commas. (example: `"ja,en"`)
 * - `x-cors`: Specifying this attribute enables the CORS proxy. By default cors.deno.dev is used. Override `GbfsMap.toCorsUrl` if you want to use a different CORS proxy.
 */
export class GbfsMap extends HTMLElement {
  /**
   * Creates a CORS proxy URL that will be used if x-cors is specified.
   * Override here if you want to use any CORS proxy. By default https://cors.deno.dev is used.
   *
   * ```
   * import { GbfsMap } from "https://deno.land/x/gbfs_map/mod.js";
   * GbfsMap.toCorsUrl = url => `https://my-cors-proxy/${url}`
   * ```
   *
   * @param  {string} url
   */
  static toCorsUrl(url) {
    return `https://cors.deno.dev/${url}`;
  }
  /**
   * Dictionary used for localization of map control elements.
   * Add values to this object if you want to extend your localization.
   * ```js
   * import { GbfsMap } from "https://deno.land/x/gbfs_map/mod.js";
   * GbfsMap.i18n.fr = {
   *   availableBikeCheckbox: "Display only lending%OK%",
   *   availableDockCheckbox: "Display only return%OK%",
   *   availableBike: "Lending:%OK%（%num_bikes_available%）",
   *   unavailableBike: "Lending:%NG%",
   *   availableDock: "Returning:%OK%（%num_docks_available%）",
   *   unavailableDock: "Returning:%NG%",
   *   update: "（update: %update%）",
   * }
   * ```
   * The value specified in the x-preferred-languages attribute is used.
   * Fallback to English if no suitable localization is found.
   * You can embed a value in the format `%xxx%`:
   * - `%OK%`: OK icon
   * - `%NG%`: NG icon
   * - `%num_bikes_available%`: number of bikes available
   * - `%num_docks_available%`: number of docks available
   * - `%update%`: updated time
   *
   * You definitely need to create properties for `availableBikeCheckbox`, `availableDockCheckbox`, `unavailableBike`, `availableBike`, `unavailableBike`, `availableDock`, `unavailableDock` and `update`.
   * @type {Record<string, I18n | undefined> & Record<"en", I18n>}
   */
  static i18n = {
    en: {
      availableBikeCheckbox: "Display only lending%OK%",
      availableDockCheckbox: "Display only return%OK%",
      availableBike: "Lending:%OK%（%num_bikes_available%）",
      unavailableBike: "Lending:%NG%",
      availableDock: "Returning:%OK%（%num_docks_available%）",
      unavailableDock: "Returning:%NG%",
      update: "（update: %update%）",
    },
    ja: {
      availableBikeCheckbox: "貸出%OK%のみ表示",
      availableDockCheckbox: "返却%OK%のみ表示",
      availableBike: "貸出%OK%（%num_bikes_available%台）",
      unavailableBike: "貸出%NG%",
      availableDock: "返却%OK%（%num_docks_available%台）",
      unavailableDock: "返却%NG%",
      update: "（%update%更新）",
    },
  };
  /** @type {AbortController | undefined} */
  #abortController;
  #shadowRoot;
  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: "closed" });
    this.#shadowRoot.adoptedStyleSheets = [defaultStyle, leafletStyle];
  }
  connectedCallback() {
    // abort when disconnected
    this.#abortController = new AbortController();
    const preferredLanguagesStr = this.getAttribute("x-preferred-languages");
    const preferredLanguages = preferredLanguagesStr
      ? preferredLanguagesStr.split(",")
      : [];
    const { map, availableBikeCheckboxElement, availableDockCheckboxElement } =
      this.#initElement({ preferredLanguages });
    const urls = this.getAttribute("x-url");
    if (!urls) {
      return;
    }
    const urlConverter = this.hasAttribute("x-cors")
      ? GbfsMap.toCorsUrl
      : undefined;
    for (const url of urls.split(",")) {
      observeMapData(map, {
        availableBikeCheckboxElement,
        availableDockCheckboxElement,
        url,
        signal: this.#abortController.signal,
        urlConverter,
        preferredLanguages: preferredLanguages,
      });
    }
  }
  disconnectedCallback() {
    this.#abortController?.abort();
    this.#shadowRoot.innerHTML = "";
  }
  /**
   * init inner HTML.
   * @param {{preferredLanguages: string[];}} param0
   */
  #initElement({ preferredLanguages }) {
    const i18n = getI18n(preferredLanguages);
    const defaultLat = this.getAttribute("x-default-lat") || 0;
    const defaultLon = this.getAttribute("x-default-lon") || 0;
    const checkboxWrapper = document.createElement("section");
    const availableBikeCheckboxLabel = document.createElement("label");
    const availableDockCheckboxLabel = document.createElement("label");
    const availableBikeCheckboxElement = document.createElement("input");
    const availableDockCheckboxElement = document.createElement("input");
    const mapElement = document.createElement("div");
    availableBikeCheckboxElement.setAttribute("type", "checkbox");
    availableDockCheckboxElement.setAttribute("type", "checkbox");
    availableBikeCheckboxLabel.innerHTML = escapeHtml(
      i18n.availableBikeCheckbox,
    ).replaceAll("%OK%", '<span class="available">OK</span>');
    availableDockCheckboxLabel.innerHTML = escapeHtml(
      i18n.availableDockCheckbox,
    ).replaceAll("%OK%", '<span class="available">OK</span>');
    availableBikeCheckboxLabel.insertAdjacentElement(
      "afterbegin",
      availableBikeCheckboxElement,
    );
    availableDockCheckboxLabel.insertAdjacentElement(
      "afterbegin",
      availableDockCheckboxElement,
    );
    checkboxWrapper.append(
      availableBikeCheckboxLabel,
      availableDockCheckboxLabel,
    );
    this.#shadowRoot.append(checkboxWrapper, mapElement);

    const map = L.map(mapElement).setView([+defaultLat, +defaultLon], 15);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.control.scale().addTo(map);
    return {
      map,
      availableBikeCheckboxElement,
      availableDockCheckboxElement,
    };
  }
}
customElements.define("gbfs-map", GbfsMap);

/**
 * Observe data about cycle ports and update the map whenever there is an update.
 * @param {L.Map} map
 * @param {{
 *   url: string;
 *   availableBikeCheckboxElement: HTMLInputElement;
 *   availableDockCheckboxElement: HTMLInputElement;
 *   urlConverter?: (url: string)=>string;
 *   preferredLanguages: string[];
 *   signal?: AbortSignal;
 * }} param
 */
async function observeMapData(map, {
  url,
  availableBikeCheckboxElement,
  availableDockCheckboxElement,
  urlConverter,
  preferredLanguages,
  signal,
}) {
  signal?.throwIfAborted();
  const endpoints = await getRegistryInformation(
    urlConverter ? urlConverter(url) : url,
    preferredLanguages,
  );
  const systemInformationEndpoint = urlConverter
    ? urlConverter(endpoints.systemInformationEndpoint)
    : endpoints.systemInformationEndpoint;
  const informationEndpoint = urlConverter
    ? urlConverter(endpoints.stationInformationEndpoint)
    : endpoints.stationInformationEndpoint;
  const statusEndpoint = urlConverter
    ? urlConverter(endpoints.stationStatusEndpoint)
    : endpoints.stationStatusEndpoint;
  // Avoid await before rendering
  const informationPromise = getStationInformation(informationEndpoint);
  const systemInformationPromise = getSystemInformation(
    systemInformationEndpoint,
  );
  const iconPromise = systemInformationPromise.then((systemInformation) => {
    const iconUrl = systemInformation.brand_assets?.brand_image_url;
    return iconUrl ? createIcon(iconUrl) : blueIcon;
  });
  const systemNamePromise = systemInformationPromise.then((systemInformation) =>
    systemInformation.short_name || systemInformation.name
  );
  const defaultUrlPromise = systemInformationPromise.then((systemInformation) =>
    systemInformation.url
  );
  /** @type {StationStatus[]} */
  let currentStatus = [];
  /** @type {L.LayerGroup | undefined} */
  let currentLayerGroup;

  // add event listener
  // 1. check box change
  availableBikeCheckboxElement.addEventListener("change", () => renderIcon());
  availableDockCheckboxElement.addEventListener("change", () => renderIcon());

  // 2. mouse move event
  map.on("moveend", renderIcon);
  signal?.addEventListener("abort", () => {
    map.off("moveend", renderIcon);
  });

  // 3. port status update
  for await (const { status, update } of getStationStatus(statusEndpoint)) {
    if (signal?.aborted) {
      break;
    }
    currentStatus = status;
    const information = await informationPromise;
    const systemName = await systemNamePromise;
    const defaultUrl = await defaultUrlPromise;
    for (const st of status) {
      const stationInformation = information[st.station_id];
      stationInformation?.marker.bindPopup(
        createPopupText(stationInformation, st, {
          update,
          systemName,
          defaultUrl,
        }, { preferredLanguages }),
      );
    }
    renderIcon();
  }

  // closure
  async function renderIcon() {
    const information = await informationPromise;
    const icon = await iconPromise;

    // Remove all existing tiles
    currentLayerGroup?.removeFrom(map);
    currentLayerGroup = undefined;

    const onlyAvailableBike = availableBikeCheckboxElement.checked;
    const onlyAvailableDock = availableDockCheckboxElement.checked;

    // Switches the content to be displayed according to the zoom level.
    const zoom = map.getZoom();
    if (13 < zoom) {
      // render marker
      const { minLon, maxLon, minLat, maxLat } = getCurrentRect(map);
      for (const st of currentStatus) {
        const {
          station_id,
          num_bikes_available,
          num_docks_available,
          is_renting,
          is_returning,
        } = st;
        const stationInformation = information[station_id];
        if (!stationInformation) {
          continue;
        }
        const { lat, lon, marker } = stationInformation;
        // Draws an icon within the visible range
        if (
          minLon < lon && lon < maxLon && minLat < lat && lat < maxLat &&
          (!onlyAvailableBike || 0 < num_bikes_available && is_renting) &&
          (!onlyAvailableDock || 0 < num_docks_available && is_returning)
        ) {
          marker.setIcon(icon);
          marker.addTo(map);
        } else {
          marker.removeFrom(map);
        }
      }
    } else {
      // render blue tile
      /** @type {L.Rectangle[]} */
      const currentTiles = [];
      const tiles = getCurrentTiles(map, {
        status: currentStatus,
        information,
        onlyAvailableBike,
        onlyAvailableDock,
        latSize: 9 < zoom ? 30 / 60 / 60 : 6 < zoom ? 5 / 60 : 8 / zoom,
        lonSize: 9 < zoom ? 45 / 60 / 60 : 6 < zoom ? 7.5 / 60 : 8 / zoom,
      });
      for (const tile of tiles) {
        currentTiles.push(L.rectangle(tile.rectangle, {
          stroke: false,
          fill: true,
          fillColor: "#00f",
          fillOpacity: tile.count < 5 ? 0.1 : 0.2,
          interactive: false,
        }));
      }
      currentLayerGroup = L.layerGroup(currentTiles).addTo(map);

      // remove all marker
      for (const { station_id } of currentStatus) {
        const stationInformation = information[station_id];
        if (!stationInformation) {
          continue;
        }
        stationInformation.marker.removeFrom(map);
      }
    }
  }
}

/**
 * get gbfs.json data
 * @param  {string} url
 * @param  {string[]} [languages]
 */
async function getRegistryInformation(url, languages) {
  const res = await fetch(url);
  const { data } = await res.json();
  // If languages are given, look for them. If it doesn't exist, it will fall back to 0th.
  /** @type {{feeds: {name: string; url: string}[]}} */
  const { feeds } = languages
    ? data[languages.find((language) => data[language]) || Object.keys(data)[0]]
    : Object.values(data)[0];
  return {
    stationStatusEndpoint: /** @type {{url: string}} */
      (feeds.find((feed) => feed.name === "station_status")).url,
    stationInformationEndpoint: /** @type {{url: string}} */
      (feeds.find((feed) => feed.name === "station_information")).url,
    systemInformationEndpoint: /** @type {{url: string}} */
      (feeds.find((feed) => feed.name === "system_information")).url,
  };
}

/**
 * @typedef {{
 *   url?: string;
 *   name?: string;
 *   short_name?: string;
 *   brand_assets: {
 *     brand_image_url: string | undefined;
 *   } | undefined;
 * }} SystemInformation
 */

/**
 * get system_information.json data.
 * @param  {string} url
 */
async function getSystemInformation(url) {
  const response = await fetch(url);
  const { data } = await response.json();
  return /** @type {SystemInformation} */ (data);
}

/**
 * @typedef {{
 *   lat: number;
 *   lon: number;
 *   name: string;
 *   marker: L.Marker;
 *   rental_uris: {
 *     ios: string;
 *     android: string;
 *     web: string;
 *   } | undefined;
 * }} StationInformation
 */

/**
 * get station_information.json data.
 * @param  {string} url
 */
async function getStationInformation(url) {
  const response = await fetch(url);
  const { data: { stations } } = await response.json();
  /** @type {Record<string, StationInformation | undefined>} */
  const result = {};
  for (const station of stations) {
    result[station.station_id] = {
      lat: station.lat,
      lon: station.lon,
      name: station.name,
      rental_uris: station.rental_uris,
      marker: L.marker([station.lat, station.lon], { icon: blueIcon }),
    };
  }
  return result;
}

/**
 * @typedef {{
 *   is_renting: boolean;
 *   is_returning: boolean;
 *   num_bikes_available: number;
 *   num_docks_available: number;
 *   station_id: string;
 *   last_updated: string;
 * }} StationStatus
 */

/**
 * An iterator to get station_status.json.
 * This iterator will be resolved with new data after waiting for the given ttl.
 *
 * ```
 * for await (const data of getStationStatus(url)) {
 *   // The data is displayed at intervals of the ttl value returned by the API.
 *   console.log(data)
 * }
 * ```
 *
 * @param  {string}  url
 */
async function* getStationStatus(url) {
  while (true) {
    const response = await fetch(url);
    const { data: { stations }, ttl, last_updated } = await response.json();
    yield {
      status: /** @type {StationStatus[]} */ (stations),
      update: new Date(last_updated * 1000).toLocaleTimeString(),
    };
    await new Promise((resolve) => setTimeout(resolve, (ttl || 60) * 1000));
  }
}

/**
 * Gets the tiles displayed when the map is zoomed out.
 * The tile color intensity indicates how many ports are in range.
 * @param {L.Map} map
 * @param {{
 *   information: Record<string, StationInformation | undefined>;
 *   status: StationStatus[]
 *   onlyAvailableBike:boolean;
 *   onlyAvailableDock: boolean;
 *   lonSize: number;
 *   latSize: number;
 * }} options
 */
function getCurrentTiles(map, {
  status,
  information,
  onlyAvailableBike,
  onlyAvailableDock,
  lonSize,
  latSize,
}) {
  const { minLon, maxLon, minLat, maxLat } = getCurrentRect(map);
  const lonStart = Math.floor(minLon / lonSize) * lonSize;
  const lonEnd = Math.ceil(maxLon / lonSize) * lonSize;
  const latStart = Math.floor(minLat / latSize) * latSize;
  const latEnd = Math.ceil(maxLat / latSize) * latSize;
  /** @type {Record<string, {count: number; rectangle: [[number, number], [number, number]];}>} */
  const res = {};
  for (const st of status) {
    const {
      station_id,
      num_bikes_available,
      num_docks_available,
      is_renting,
      is_returning,
    } = st;
    const stationInformation = information[station_id];
    if (!stationInformation) {
      continue;
    }
    const { lat, lon } = stationInformation;
    if (
      lonStart < lon && lon < lonEnd && latStart < lat && lat < latEnd &&
      (!onlyAvailableBike || 0 < num_bikes_available && is_renting) &&
      (!onlyAvailableDock || 0 < num_docks_available && is_returning)
    ) {
      const baseLon = Math.floor(lon / lonSize);
      const baseLat = Math.floor(lat / latSize);
      const key = `${baseLon}_${baseLat}`;
      res[key] ??= {
        count: 0,
        rectangle: [
          [baseLat * latSize, baseLon * lonSize],
          [(baseLat + 1) * latSize, (baseLon + 1) * lonSize],
        ],
      };
      res[key].count++;
    }
  }
  return Object.values(res);
}

/**
 * Returns the range of coordinates currently displayed by the map.
 * @param  {L.Map} map
 */
function getCurrentRect(map) {
  const bounds = map.getBounds();
  const east = bounds.getEast();
  const west = bounds.getWest();
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  return {
    minLon: Math.min(east, west),
    maxLon: Math.max(east, west),
    minLat: Math.min(north, south),
    maxLat: Math.max(north, south),
  };
}

/**
 * create leaflet icon from ico 's url
 * @param  {string} iconUrl
 */
function createIcon(iconUrl) {
  return L.icon({
    iconUrl,
    shadowUrl: `${leafletUrl}dist/images/marker-shadow.png`,
    iconSize: [25, 25],
    iconAnchor: [15, 15],
    popupAnchor: [0, -10],
    shadowSize: [40, 40],
    shadowAnchor: [3, 20],
    className: "icon-custum",
  });
}

/**
 * construct popup text
 * @param  {StationInformation} information
 * @param  {StationStatus} status
 * @param  {{update: string; systemName?: string; defaultUrl?: string}} options1
 * @param  {{preferredLanguages: string[];}} options2
 */
function createPopupText(
  { name, rental_uris },
  { num_bikes_available, num_docks_available, is_renting, is_returning },
  { update, systemName, defaultUrl },
  { preferredLanguages },
) {
  const i18n = getI18n(preferredLanguages);
  const url = rental_uris?.web || defaultUrl;
  const bikeText = is_renting && 0 < num_bikes_available
    ? i18n.availableBike
    : i18n.unavailableBike;
  const dockText = is_returning && 0 < num_docks_available
    ? i18n.availableDock
    : i18n.unavailableDock;
  const updateText = escapeHtml(i18n.update).replaceAll("%update%", update);
  return `
  ${systemName ? `<b>[${systemName}]</b><br>` : ""}
  <b>${url ? `<a href=${url} target="_brank">${name}</a>` : name}</b><br><hr>
  ${
    escapeHtml(bikeText)
      .replaceAll("%OK%", '<span class="available">OK</span>')
      .replaceAll("%NG%", '<span class="unavailable">NG</span>')
      .replaceAll("%num_bikes_available%", `${num_bikes_available}`)
  }<br>
  ${
    escapeHtml(dockText)
      .replaceAll("%OK%", '<span class="available">OK</span>')
      .replaceAll("%NG%", '<span class="unavailable">NG</span>')
      .replaceAll("%num_docks_available%", `${num_docks_available}`)
  }<br>
  ${updateText}`;
}

/**
 * @typedef {{
 *    availableBikeCheckbox: string;
 *    availableDockCheckbox: string;
 *    availableBike: string;
 *    unavailableBike: string;
 *    availableDock: string;
 *    unavailableDock: string;
 *    update: string;
 * }} I18n
 */

/**
 * get i18n object
 * @param {string[]} preferredLanguages
 */
function getI18n(preferredLanguages) {
  for (const language of preferredLanguages) {
    const i18n = GbfsMap.i18n[language];
    if (i18n) {
      return i18n;
    }
  }
  return GbfsMap.i18n.en;
}

/**
 * escape html tag
 * @param  {string} str
 */
function escapeHtml(str) {
  return str.replaceAll(/[&'`"<>]/g, (match) => {
    return /** @type{string} */ ({
      "&": "&amp;",
      "'": "&#x27;",
      "`": "&#x60;",
      '"': "&quot;",
      "<": "&lt;",
      ">": "&gt;",
    }[match]);
  });
}

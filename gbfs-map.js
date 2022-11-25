// @ts-check
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />

import * as L from "https://esm.sh/leaflet@1.9.2";

const blueIcon = L.icon({
  iconUrl: "https://esm.sh/leaflet@1.9.2/dist/images/marker-icon.png",
  iconRetinaUrl: "https://esm.sh/leaflet@1.9.2/dist/images/marker-icon-2x.png",
  shadowUrl: "https://esm.sh/leaflet@1.9.2/dist/images/marker-shadow.png",
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
  const res = await fetch("https://esm.sh/leaflet@1.9.2/dist/leaflet.css");
  leafletStyle.replace(await res.text());
})();

export class GbfsMap extends HTMLElement {
  /** @param  {string} url */
  /**
   * Creates a CORS proxy URL that will be used if x-cors is specified.
   * Override here if you want to use any CORS proxy. By default cors.deno.dev is used.
   *
   * ```
   * import { GbfsMap } from "./gbfs-map.js";
   * GbfsMap.toCorsUrl = url => `https://my-cors-proxy/${url}`
   * ```
   *
   * @param  {string} url
   */
  static toCorsUrl(url) {
    return `https://cors.deno.dev/${url}`;
  }
  /**
   * [i18n description]
   * @type {Record<string, {}>}
   */
  static i18n = {
    ja: {},
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
    this.#abortController = new AbortController();
    const { map, availableBikeCheckboxElement, availableDockCheckboxElement } =
      this.#initElement();
    const urls = this.getAttribute("x-url");
    if (!urls) {
      return;
    }
    const urlConverter = this.hasAttribute("x-cors")
      ? GbfsMap.toCorsUrl
      : undefined;
    const preferredLanguages = this.getAttribute("x-preferred-languages");
    for (const url of urls.split(",")) {
      observeMapData(map, {
        availableBikeCheckboxElement,
        availableDockCheckboxElement,
        url,
        signal: this.#abortController.signal,
        urlConverter,
        preferredLanguages: preferredLanguages
          ? preferredLanguages.split(",")
          : undefined,
      });
    }
  }
  disconnectedCallback() {
    this.#abortController?.abort();
    this.#shadowRoot.innerHTML = "";
  }
  #initElement() {
    const defaultLat = this.getAttribute("x-default-lat") || 0;
    const defaultLng = this.getAttribute("x-default-lng") || 0;
    const checkboxWrapper = document.createElement("section");
    const availableBikeCheckboxLabel = document.createElement("label");
    const availableDockCheckboxLabel = document.createElement("label");
    const availableBikeCheckboxElement = document.createElement("input");
    const availableDockCheckboxElement = document.createElement("input");
    const bikeAvailableIconElement = document.createElement("span");
    const dockAvailableIconElement = document.createElement("span");
    const mapElement = document.createElement("div");
    availableBikeCheckboxElement.setAttribute("type", "checkbox");
    availableDockCheckboxElement.setAttribute("type", "checkbox");
    bikeAvailableIconElement.classList.add("available");
    dockAvailableIconElement.classList.add("available");
    bikeAvailableIconElement.append("OK");
    dockAvailableIconElement.append("OK");
    availableBikeCheckboxLabel.append(
      availableBikeCheckboxElement,
      "貸出",
      bikeAvailableIconElement,
      "のみ表示",
    );
    availableDockCheckboxLabel.append(
      availableDockCheckboxElement,
      "返却",
      dockAvailableIconElement,
      "のみ表示",
    );
    checkboxWrapper.append(
      availableBikeCheckboxLabel,
      availableDockCheckboxLabel,
    );
    this.#shadowRoot.append(checkboxWrapper, mapElement);

    const map = L.map(mapElement).setView([+defaultLat, +defaultLng], 15);

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
 * @param {L.Map} map
 * @param {{
 *   url: string;
 *   availableBikeCheckboxElement: HTMLInputElement;
 *   availableDockCheckboxElement: HTMLInputElement;
 *   urlConverter?: (url: string)=>string;
 *   preferredLanguages?: string[];
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

  availableBikeCheckboxElement.addEventListener("change", () => renderIcon());
  availableDockCheckboxElement.addEventListener("change", () => renderIcon());

  map.on("moveend", renderIcon);
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
        }),
      );
    }
    renderIcon();
  }
  map.off("moveend", renderIcon);
  async function renderIcon() {
    const information = await informationPromise;
    const icon = await iconPromise;

    currentLayerGroup?.removeFrom(map);
    currentLayerGroup = undefined;

    const onlyAvailableBike = availableBikeCheckboxElement.checked;
    const onlyAvailableDock = availableDockCheckboxElement.checked;

    const zoom = map.getZoom();
    if (13 < zoom) {
      const { minLng, maxLng, minLat, maxLat } = getCurrentRect(map);
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
        if (
          minLng < lon && lon < maxLng && minLat < lat && lat < maxLat &&
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
      /** @type {L.Rectangle[]} */
      const currentTiles = [];
      const tiles = getCurrentTiles(map, {
        status: currentStatus,
        information,
        onlyAvailableBike,
        onlyAvailableDock,
        latSize: 9 < zoom ? 30 / 60 / 60 : 6 < zoom ? 5 / 60 : 8 / zoom,
        lngSize: 9 < zoom ? 45 / 60 / 60 : 6 < zoom ? 7.5 / 60 : 8 / zoom,
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
 * @param  {string} url
 * @param  {string[]} [languages]
 */
async function getRegistryInformation(url, languages) {
  const res = await fetch(url);
  const { data } = await res.json();
  /** @type {{feeds: {name: string; url: string}[]}} */
  const { feeds } = languages
    ? languages.find((language) => data[language]) || Object.values(data)[0]
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

/** @param  {string} url */
async function getSystemInformation(url) {
  const response = await fetch(`${url}?d=${Date.now()}`);
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

/** @param  {string} url */
async function getStationInformation(url) {
  const response = await fetch(`${url}?d=${Date.now()}`);
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
 * @param  {string}  url
 */
async function* getStationStatus(url) {
  while (true) {
    const response = await fetch(`${url}?d=${Date.now()}`);
    const { data: { stations }, ttl, last_updated } = await response.json();
    yield {
      status: /** @type {StationStatus[]} */ (stations),
      update: new Date(last_updated * 1000).toLocaleTimeString(),
    };
    await new Promise((resolve) => setTimeout(resolve, (ttl || 60) * 1000));
  }
}

/** @param  {L.Map} map */
function getCurrentRect(map) {
  const bounds = map.getBounds();
  const east = bounds.getEast();
  const west = bounds.getWest();
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  return {
    minLng: Math.min(east, west),
    maxLng: Math.max(east, west),
    minLat: Math.min(north, south),
    maxLat: Math.max(north, south),
  };
}

/**
 * @param {L.Map} map
 * @param {{
 *   information: Record<string, StationInformation | undefined>;
 *   status: StationStatus[]
 *   onlyAvailableBike:boolean;
 *   onlyAvailableDock: boolean;
 *   lngSize: number;
 *   latSize: number;
 * }} options
 */
function getCurrentTiles(map, {
  status,
  information,
  onlyAvailableBike,
  onlyAvailableDock,
  lngSize,
  latSize,
}) {
  const { minLng, maxLng, minLat, maxLat } = getCurrentRect(map);
  const lngStart = Math.floor(minLng / lngSize) * lngSize;
  const lngEnd = Math.ceil(maxLng / lngSize) * lngSize;
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
      lngStart < lon && lon < lngEnd && latStart < lat && lat < latEnd &&
      (!onlyAvailableBike || 0 < num_bikes_available && is_renting) &&
      (!onlyAvailableDock || 0 < num_docks_available && is_returning)
    ) {
      const baseLng = Math.floor(lon / lngSize);
      const baseLat = Math.floor(lat / latSize);
      const key = `${baseLng}_${baseLat}`;
      res[key] ??= {
        count: 0,
        rectangle: [
          [baseLat * latSize, baseLng * lngSize],
          [(baseLat + 1) * latSize, (baseLng + 1) * lngSize],
        ],
      };
      res[key].count++;
    }
  }
  return Object.values(res);
}

/** @param  {string} iconUrl */
function createIcon(iconUrl) {
  return L.icon({
    iconUrl,
    shadowUrl: "https://esm.sh/leaflet@1.9.2/dist/images/marker-shadow.png",
    iconSize: [25, 25],
    iconAnchor: [15, 15],
    popupAnchor: [0, -10],
    shadowSize: [40, 40],
    shadowAnchor: [3, 20],
    className: "icon-custum",
  });
}

/**
 * @param  {StationInformation} information
 * @param  {StationStatus} status
 * @param  {{update: string; systemName?: string; defaultUrl?: string}} options
 */
function createPopupText(
  { name, rental_uris },
  { num_bikes_available, num_docks_available, is_renting, is_returning },
  { update, systemName, defaultUrl },
) {
  const url = rental_uris?.web || defaultUrl;
  return `
  ${systemName ? `<b>[${systemName}]</b><br>` : ""}
  <b>${url ? `<a href=${url} target="_brank">${name}</a>` : name}</b><br><hr>
  貸出${
    is_renting && 0 < num_bikes_available
      ? `<span class="available">OK</span>（${num_bikes_available}台）`
      : `<span class="unavailable">NG</span>`
  }<br>
  返却${
    is_returning && 0 < num_docks_available
      ? `<span class="available">OK</span>（${num_docks_available}台）`
      : `<span class="unavailable">NG</span>`
  }<br>
  （${update}更新）`;
}

// @ts-check
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />

import * as L from "https://esm.sh/leaflet@1.9.2";

const sheet = new CSSStyleSheet();
(async () => {
  const res = await fetch("https://esm.sh/leaflet@1.9.2/dist/leaflet.css");
  sheet.replace(await res.text());
})();

export class GbfsMap extends HTMLElement {
  #shadowRoot;
  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: "closed" });
    this.#shadowRoot.adoptedStyleSheets = [sheet];
  }
  connectedCallback() {
    this.#initElement();
  }
  #initElement() {
    const defaultLat = this.getAttribute("x-default-lat") || 0;
    const defaultLng = this.getAttribute("x-default-lng") || 0;
    console.log(+defaultLat, +defaultLng);
    const mapElement = document.createElement("div");
    mapElement.style.height = "300px";
    this.#shadowRoot.append(mapElement);

    const map = L.map(mapElement).setView([+defaultLat, +defaultLng], 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // L.marker([51.5, -0.09]).addTo(map)
    //   .bindPopup("A pretty CSS3 popup.<br> Easily customizable.")
    //   .openPopup();
  }
}
customElements.define("gbfs-map", GbfsMap);

class GbfsRegistry {
  /** @type {Promise<GbfsResult>} */
  #loadPromise;
  /** @type {undefined | ((value: GbfsResult) => void)} */
  #resolvePromise;
  #systemInformationEndpoints;
  #stationInformationEndpoints;
  /** @type {GbfsResult} */
  #data;
  #timeoutId;
  constructor({ url, language }) {
    this.#loadPromise = new Promise((r) => this.#resolvePromise = r);

    (async () => {
      const res = await fetch(
        "https://api-public.odpt.org/api/v4/gbfs/hellocycling/gbfs.json",
      );
      const { data } = await res.json();
      /** @type {{feeds: {name: string; url: string}[]}} */
      const { feeds } = language ? data[language] : Object.values(data)[0];
      for (const { name, url } of feeds) {
        if (name === "system_information") {
          this.#systemInformationEndpoints = url;
        } else if (name === "station_information") {
          this.#stationInformationEndpoints = url;
        }
      }

      this.loadStationStatus();
      const systemRes = await fetch(this.#systemInformationEndpoints);
      const { data: { stations } } = await systemRes.json();
      for (const station of stations) {
        this.#data[station.station_id] ??= {};
        this.#data[station.station_id].lat = station.lat;
        this.#data[station.station_id].lon = station.lon;
        this.#data[station.station_id].name = station.name;
        this.#data[station.station_id].rental_uris = station.rental_uris;
      }
      this.#resolvePromise?.(this.#data);
      this.#loadPromise = new Promise((r) => this.#resolvePromise = r);
    })();
  }
  async loadStationStatus() {
    clearTimeout(this.#timeoutId);
    const response = await fetch(this.#stationInformationEndpoints);
    const { data: { stations }, ttl } = await response.json();
    for (const station of stations) {
      this.#data[station.station_id] ??= {};
      this.#data[station.station_id].num_bikes_available =
        station.num_bikes_available;
      this.#data[station.station_id].num_docks_available =
        station.num_docks_available;
    }
    this.#resolvePromise?.(this.#data);
    this.#loadPromise = new Promise((r) => this.#resolvePromise = r);
    this.#timeoutId = setTimeout(() => this.loadStationStatus(), ttl * 1000);
  }
  clearTimeout() {
    clearTimeout(this.#timeoutId);
  }
  /**
   * [then description]
   * @param  {(value: GbfsResult) => void} onfulfilled
   * @param  {(value: unknown) => void} onrejected
   */
  then(onfulfilled, onrejected) {
    this.#loadPromise.then(onfulfilled, onrejected);
  }
}

/**
 * @typedef {Record<string, {num_bikes_available: number; num_docks_available: number}>} GbfsResult
 */

const r = new GbfsRegistry({});
while (true) {
  console.log(await r);
}

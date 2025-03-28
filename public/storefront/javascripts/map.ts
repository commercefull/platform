// @ts-expect-error TS(2304): Cannot find name 'mapboxgl'.
mapboxgl.accessToken =
  "pk.eyJ1IjoibS0xMzVhIiwiYSI6ImNrOGsyb3ZqaDBkemkzcW10emc1eXoyNngifQ.NuSNrMKqrpdm-jxvPpx0_Q";
const lat = 48.8606;
const lng = 2.3376;

// @ts-expect-error TS(2304): Cannot find name 'mapboxgl'.
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  zoom: 8,
  center: [lng, lat],
});

// @ts-expect-error TS(2304): Cannot find name 'mapboxgl'.
const marker = new mapboxgl.Marker().setLngLat([lng, lat]).addTo(map);

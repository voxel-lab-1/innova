import https from "https";

const assets = [
  "https://innova1.vercel.app/",
  "https://innova1.vercel.app/assets/index-BkH12gGl.css",
  "https://innova1.vercel.app/assets/index-B0XhQ5BT.js"
];

for (const url of assets) {
  https.get(url, (res) => {
    console.log(`URL: ${url} -> Status: ${res.statusCode}, Content-Length: ${res.headers['content-length']}`);
  }).on("error", (err) => {
    console.error(`Error fetching ${url}:`, err);
  });
}

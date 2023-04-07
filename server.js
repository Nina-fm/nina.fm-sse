const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
require("dotenv").config();

const STREAM_API_REFRESH_TIME = 5000;
const STREAM_API_URL = "https://prog.nina.fm/api/live-info";
const STREAM_API_URL_FALLBACK = "http://flux.nina.fm/status-json.xsl";

const { PORT = 3000 } = process.env;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/status", (request, response) =>
  response.json({ clients: clients.length })
);

app.listen(PORT, () => {
  console.log(":: AIRTIME EVENTS SERVICE ::");
  console.log(`(Listening at http://localhost:${PORT})`);
});

/**
 * App vars
 */
let clients = [];
let airTimeData = {};
let iceCastData = {};

/**
 * Utility functions
 */
const isDeepEqual = (obj1, obj2) =>
  JSON.stringify(obj1) === JSON.stringify(obj2);

const getData = () => {
  return {
    data: {
      iceCast: iceCastData,
      airTime: airTimeData,
    },
  };
};

const getResponse = () => {
  return `${JSON.stringify(getData())}\n\n`;
};

const updateAirTime = async () => {
  const { data, error } = await axios.get(STREAM_API_URL);
  if (error) {
    airTimeData = {};
    return true;
  }

  const { schedulerTime, ...response } = data;
  if (!isDeepEqual(response, airTimeData)) {
    airTimeData = response;
    return true;
  }
  return false;
};

const updateIceCast = async () => {
  const { data } = await axios.get(STREAM_API_URL_FALLBACK);
  const response = data.icestats.source;

  if (!isDeepEqual(response, iceCastData)) {
    iceCastData = response;
    await updateAirTime();

    return true;
  }

  return false;
};

const sendEventsToAll = () => {
  clients.forEach((client) => client.response.write(getResponse()));
};

const updateAll = async () => {
  const updateIC = await updateIceCast();
  if (updateIC) sendEventsToAll();
};

setInterval(updateAll, STREAM_API_REFRESH_TIME);
updateAll();

/**
 * GET Route for AirTime infos
 */
const eventsHandler = (request, response, next) => {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };
  response.writeHead(200, headers);
  response.write(getResponse());

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response,
  };

  clients.push(newClient);

  request.on("close", () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter((client) => client.id !== clientId);
  });
};

app.get("/events", eventsHandler);

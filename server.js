const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const { DateTime } = require("luxon");
require("dotenv").config();

const STREAM_API_REFRESH_TIME = 3000;
const STREAM_API_URL = "https://prog.nina.fm/api/live-info";
const STREAM_API_URL_FALLBACK = "http://flux.nina.fm/status-json.xsl";

const { PORT = 3000 } = process.env;

const headers = {
  "Content-Type": "text/event-stream",
  Connection: "keep-alive",
  "Cache-Control": "no-cache",
  "X-Accel-Buffering": "no",
};

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/status", (request, response) =>
  response.json({ dataClients: dataClients.length })
);

app.listen(PORT, () => {
  console.log(":: NINA.FM SSE SERVICE ::");
  console.log(`(Listening at http://localhost:${PORT})`);
});

/**
 * App vars
 */
let dataClients = [];
let airTimeData = {};
let iceCastData = {};

let progressClients = [];
let progress;

/**
 * Utility functions
 */
const isDeepEqual = (obj1, obj2) =>
  JSON.stringify(obj1) === JSON.stringify(obj2);

const parseAirTimeDate = (date) =>
  DateTime.fromFormat(date.replace(/\.\d+$/, ""), "yyyy-MM-dd HH:mm:ss");

const getData = () => {
  return {
    iceCast: iceCastData,
    airTime: airTimeData,
  };
};

const getResponse = () => {
  return `data: ${JSON.stringify(getData())}\n\n`;
};

const getProgressResponse = () => {
  return `data: ${progress}\n\n`;
};

const updateAirTime = async () => {
  const { data, error } = await axios.get(STREAM_API_URL);
  if (error) {
    airTimeData = {};
    return true;
  }

  updateProgress(data);

  const { schedulerTime, ...response } = data;
  if (!isDeepEqual(response, airTimeData)) {
    airTimeData = data;
    return true;
  }
  return false;
};

const updateIceCast = async () => {
  const { data } = await axios.get(STREAM_API_URL_FALLBACK);
  const response = data.icestats.source;

  if (!isDeepEqual(response, iceCastData)) {
    iceCastData = response;
    return true;
  }

  return false;
};

const updateProgress = (data) => {
  console.log("airTimeData", { schedulerTime: data.schedulerTime });
  if (data.schedulerTime) {
    const schedulerTime = parseAirTimeDate(data.schedulerTime);
    const currentStarts = parseAirTimeDate(data.current.starts);
    const currentEnds = parseAirTimeDate(data.current.ends);
    const timezoneOffset = Number(data.timezoneOffset);
    const timeElapsed =
      schedulerTime.diff(currentStarts, "milliseconds").milliseconds -
      timezoneOffset * 1000;
    const trackLength = currentEnds.diff(
      currentStarts,
      "milliseconds"
    ).milliseconds;
    progress = (timeElapsed * 100) / trackLength;
  } else {
    progress = 0;
  }
  sendProgressToAll();
};

const sendEventsToAll = () => {
  dataClients.forEach((client) => client.response.write(getResponse()));
};

const sendProgressToAll = () => {
  progressClients.forEach((client) =>
    client.response.write(getProgressResponse())
  );
};

const updateAll = async () => {
  const updateIC = await updateIceCast();
  await updateAirTime();
  if (updateIC) sendEventsToAll();
};

setInterval(updateAll, STREAM_API_REFRESH_TIME);
updateAll();

/**
 * GET Route for AirTime infos
 */
app.get("/progress", (request, response, next) => {
  response.writeHead(200, headers);
  response.write(getProgressResponse());

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response,
  };

  progressClients.push(newClient);

  request.on("close", () => {
    console.log(`${clientId} Connection closed`);
    progressClients = progressClients.filter(
      (client) => client.id !== clientId
    );
  });
});

/**
 * GET Route for AirTime infos
 */
app.get("/events", (request, response, next) => {
  response.writeHead(200, headers);
  response.write(getResponse());

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response,
  };

  dataClients.push(newClient);

  request.on("close", () => {
    console.log(`${clientId} Connection closed`);
    dataClients = dataClients.filter((client) => client.id !== clientId);
  });
});

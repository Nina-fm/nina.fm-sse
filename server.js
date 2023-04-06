import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const {
  API_PORT,
  STREAM_API_REFRESH_TIME,
  STREAM_API_URL,
  STREAM_API_URL_FALLBACK,
} = process.env;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/status", (request, response) =>
  response.json({ clients: clients.length })
);

app.listen(API_PORT, () => {
  console.log(":: AIRTIME EVENTS SERVICE ::");
  console.log(`(Listening at http://localhost:${API_PORT})`);
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
    // console.log("update airTimeData");
    return true;
  }
  return false;
};

const updateIceCast = async () => {
  const { data } = await axios.get(STREAM_API_URL_FALLBACK);
  const response = data.icestats.source;

  if (!isDeepEqual(response, iceCastData)) {
    iceCastData = response;
    // console.log("update iceCastData");

    return true;
  }

  return false;
};

const sendEventsToAll = () => {
  clients.forEach((client) => client.response.write(getResponse()));
};

setInterval(async () => {
  const updateAT = await updateAirTime();
  const updateIC = await updateIceCast();
  if (updateAT || updateIC) sendEventsToAll();
}, STREAM_API_REFRESH_TIME);

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

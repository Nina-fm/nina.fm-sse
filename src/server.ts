import { EventsDataService } from '@services/events';
import { ListenersDataService } from '@services/listeners';
import { ProgressDataService } from '@services/progress';
import { AirTimeDataApi } from 'api/airtime';
import { IceCastDataApi } from 'api/icecast';
import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import serverConfig from './server.config';

/**
 * Initialize Express
 */

const app: Application = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.listen(serverConfig.port, () => {
  console.log('');
  console.log('NINA.FM SSE');
  console.log(`Listening at http://localhost:${serverConfig.port}`);
  console.log('');
});

/**
 * Initialize Data APIs
 */

const icecast = new IceCastDataApi();
const airtime = new AirTimeDataApi();

/**
 * Initialize Data Services
 */

const listeners = new ListenersDataService();
const progress = new ProgressDataService();
const events = new EventsDataService();

/**
 * Run the update function every X seconds
 * to fetch data from IceCast and AirTime
 * and update data for clients
 */

const update = async () => {
  await icecast.fetchData();
  await airtime.fetchData();

  listeners.value = icecast.listeners;
  progress.value = airtime.progress;
  events.value = {
    icecast: icecast.data,
    airtime: airtime.data,
  };
};

setInterval(update, serverConfig.refreshInterval);
update();

/**
 * Define Routes
 */

app.get('/', (_request: Request, response: Response) => {
  response.sendFile('index.html', {
    root: __dirname,
  });
});

/**
 * GET Route for listeners info
 * @returns {number} number for listeners count
 */
app.get('/listeners', (request: Request, response: Response) => {
  response.writeHead(200, serverConfig.headers);
  response.write(listeners.response);
  const newClient = listeners.addClient(response);
  request.on('close', () => {
    console.log(`${newClient.id} Connection closed`);
    listeners.removeClient(newClient.id);
  });
});

/**
 * GET Route for progress info
 * @returns {number} number for playing progress
 */
app.get('/progress', (request: Request, response: Response) => {
  response.writeHead(200, serverConfig.headers);
  response.write(progress.response);
  const newClient = progress.addClient(response);
  request.on('close', () => {
    console.log(`${newClient.id} Connection closed`);
    progress.removeClient(newClient.id);
  });
});

/**
 * GET Route for AirTime infos
 * @returns {object} JSON object with AirTime and IceCast data
 */
app.get('/events', (request: Request, response: Response) => {
  response.writeHead(200, serverConfig.headers);
  response.write(events.response);
  const newClient = events.addClient(response);
  request.on('close', () => {
    console.log(`${newClient.id} Connection closed`);
    events.removeClient(newClient.id);
  });
});

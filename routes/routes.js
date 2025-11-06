import express from 'express';
import * as logic from '../controller/logic.js'
import {middlewareJWT} from "../auth/jwt.js";
import {getBlockedTimes} from "../controller/logic.js";


const Router = express.Router();

Router.post('/api/auth/register',logic.register);
Router.post('/api/auth/login',logic.logIn);
Router.post('/api/create',middlewareJWT, logic.createEvent);
Router.delete('/api/delete/:eventId',middlewareJWT , logic.deleteEvent);
Router.patch('/api/update/:eventId',middlewareJWT, logic.updateEvent);
Router.get('/api/getEvent/:userId',middlewareJWT,logic.getEventByUserId);
Router.get('/api/SSE/:email',logic.subscribeUser);
Router.get('/api/getAll/:id',middlewareJWT,logic.getSwappableEvent);
Router.post('/api/swapRequest/:id/:eventId/:userEventId',middlewareJWT, logic.sendSwapRequest);
Router.post('/api/responceToRequest/:swapId',middlewareJWT, logic.responseToRequest);
Router.get('/api/getSwap/:id',middlewareJWT,logic.getSwapData);
Router.get('/api/busy-times', middlewareJWT, logic.getBlockedTimes);

export default Router;

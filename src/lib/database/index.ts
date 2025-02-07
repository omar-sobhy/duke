import mongoose from 'mongoose';
import { playerModel } from './models/player.model';

const models = [playerModel(mongoose)];

export { models };

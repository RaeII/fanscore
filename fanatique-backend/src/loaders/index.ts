import { Application } from "express";

import expressLoader from "./express";
import MysqlService from "@/services/MySQL.service";
// import cron from "./cron";

export default async (app: Application) => {
  console.log("Initializing loaders...");

  MysqlService.initialize();

  await expressLoader(app);
  //clcron();
  console.log("Express loaded.");
};

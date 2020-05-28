import { createHttpAction } from "./utils";
import * as backend from "../services/backend";

export const heartbeat = createHttpAction("HEARTBEAT", () =>
  backend.heartbeat()
);

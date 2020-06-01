import * as backend from "../services/backend";
import { createHttpAction } from "./utils";

export const heartbeat = createHttpAction(
  "HEARTBEAT",
  () => backend.heartbeat(),
  { onlineOnly: false }
);

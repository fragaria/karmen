import { createThunkedAction } from "./utils";
import * as backend from "../services/backend";

export const heartbeat = createThunkedAction("HEARTBEAT", () =>
  backend.heartbeat()
);

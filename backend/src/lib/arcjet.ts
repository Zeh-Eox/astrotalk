import arcjet, {
  shield,
  detectBot,
  slidingWindow,
} from "@arcjet/node";

import { ENV } from "./env.js";

const arcjetConfig = arcjet({
  key: ENV.ARCJET_KEY satisfies string,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    slidingWindow({
      mode: "LIVE",
      max: 100,
      interval: 60,
    }),
  ],
});

export default arcjetConfig;
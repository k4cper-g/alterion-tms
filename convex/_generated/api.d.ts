/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as agent from "../agent.js";
import type * as agentConfigurations from "../agentConfigurations.js";
import type * as connections from "../connections.js";
import type * as currency from "../currency.js";
import type * as dashboard from "../dashboard.js";
import type * as demo from "../demo.js";
import type * as email from "../email.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as http from "../http.js";
import type * as langGraphAgent from "../langGraphAgent.js";
import type * as mailgun from "../mailgun.js";
import type * as negotiations from "../negotiations.js";
import type * as notifications from "../notifications.js";
import type * as offers from "../offers.js";
import type * as openai from "../openai.js";
import type * as users from "../users.js";
import type * as weather from "../weather.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  agent: typeof agent;
  agentConfigurations: typeof agentConfigurations;
  connections: typeof connections;
  currency: typeof currency;
  dashboard: typeof dashboard;
  demo: typeof demo;
  email: typeof email;
  emailTemplates: typeof emailTemplates;
  http: typeof http;
  langGraphAgent: typeof langGraphAgent;
  mailgun: typeof mailgun;
  negotiations: typeof negotiations;
  notifications: typeof notifications;
  offers: typeof offers;
  openai: typeof openai;
  users: typeof users;
  weather: typeof weather;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

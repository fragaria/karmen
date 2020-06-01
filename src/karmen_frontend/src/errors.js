export class HttpError extends Error {
  constructor(response, message) {
    super(message);
    this.response = response;
    this.name = "HTTPError";
  }
}

export class OfflineError extends Error {
  constructor(message) {
    super(message);
    this.name = "OfflineError";
  }
}

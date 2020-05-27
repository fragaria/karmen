export class HttpError extends Error {
  constructor(response, message) {
    super(message);
    this.response = response;
    this.name = "HTTPError";
  }
}

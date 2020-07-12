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

export class MaintenanceError extends Error {
  constructor(message) {
    super(message);
    this.name = "MaintenanceError";
  }
}

export class UnauthorizedError extends Error {}

export class OrganizationMismatchError extends Error {
  constructor(message) {
    super(message);
    this.name = "OrganizationMismatchError";
  }
}

// TODO populate this from env vars
const BASE_URL = 'http://localhost:5000';

export const getPrinters = (fields = []) => {
  return fetch(`${BASE_URL}/printers?fields=${fields.join(',')}`)
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Cannot get list of printers: ${response.status}`);
        return;
      }
      return response.json();
    }).catch((e) => {
      console.error(`Cannot get list of printers: ${e}`);
      return;
    });
}

export const getPrinter = (ip, fields = []) => {
  return fetch(`${BASE_URL}/printers/${ip}?fields=${fields.join(',')}`)
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Cannot get a printer: ${response.status}`);
        return;
      }
      return response.json();
    }).catch((e) => {
      console.error(`Cannot get a printer: ${e}`);
      return;
    })
}

export const deletePrinter = (ip) => {
  return fetch(`${BASE_URL}/printers/${ip}`, {
    method: 'DELETE',
  })
    .then((response) => {
      if (response.status !== 204) {
        console.error(`Cannot remove a printer: ${response.status}`);
        return false;
      }
      return true;
    }).catch((e) => {
      console.error(`Cannot remove a printer: ${e}`);
      return false;
    })
}
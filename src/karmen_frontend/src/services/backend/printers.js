const BASE_URL = window.env.BACKEND_BASE;

export const getPrinters = (fields = []) => {
  let uri = `${BASE_URL}/printers`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(',')}`;
  }
  return fetch(uri)
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Cannot get list of printers: ${response.status}`);
        return {};
      }
      return response.json()
    }).then((data) => {
      return data.items;
    }).catch((e) => {
      console.error(`Cannot get list of printers: ${e}`);
      return [];
    });
}

export const getPrinter = (host, fields = []) => {
  let uri = `${BASE_URL}/printers/${host}`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(',')}`;
  }
  return fetch(uri)
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Cannot get a printer: ${response.status}`);
        return;
      }
      return response.json();
    }).catch((e) => {
      console.error(`Cannot get a printer: ${e}`);
      return {};
    })
}

export const addPrinter = (protocol, host, name, apiKey) => {
  return fetch(`${BASE_URL}/printers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      protocol,
      host,
      name,
      api_key: apiKey
    }),
  })
    .then((response) => {
      if (response.status !== 201) {
        console.error(`Cannot add a printer: ${response.status}`);
      }
      return response.status;
    }).catch((e) => {
      console.error(`Cannot add a printer: ${e}`);
      return 500;
    })
}

export const patchPrinter = (host, data) => {
  return fetch(`${BASE_URL}/printers/${host}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.status !== 204) {
        console.error(`Cannot patch a printer: ${response.status}`);
      }
      return response.status;
    }).catch((e) => {
      console.error(`Cannot patch a printer: ${e}`);
      return 500;
    })
}

export const setPrinterConnection = (host, state) => {
  return fetch(`${BASE_URL}/printers/${host}/connection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({"state": state}),
  })
    .then((response) => {
      if (response.status !== 204) {
        console.error(`Cannot connect a printer: ${response.status}`);
      }
      return response.status;
    }).catch((e) => {
      console.error(`Cannot connect a printer: ${e}`);
      return 500;
    })
}

export const deletePrinter = (host) => {
  return fetch(`${BASE_URL}/printers/${host}`, {
    method: 'DELETE',
  })
    .then((response) => {
      if (response.status !== 204) {
        console.error(`Cannot remove a printer: ${response.status}`);
      }
      return response.status;
    }).catch((e) => {
      console.error(`Cannot remove a printer: ${e}`);
      return 500;
    })
}

export const changeCurrentJob = (host, action) => {
  return fetch(`${BASE_URL}/printers/${host}/current-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: action,
    }),
  })
    .then((response) => {
      if (response.status !== 204) {
        console.error(`Cannot change current job: ${response.status}`);
      }
      return response.status;
    }).catch((e) => {
      console.error(`Cannot change current job: ${e}`);
      return 500;
    });
}
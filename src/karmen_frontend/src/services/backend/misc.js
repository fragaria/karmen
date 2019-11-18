const BASE_URL = window.env.BACKEND_BASE;

export const getPrinterJobs = (startWith = null, orderBy = null, printerFilter = null, limit = 10) => {
    let uri = `${BASE_URL}/printjobs?limit=${limit}`;
  if (startWith) {
    uri += `&start_with=${startWith}`;
  }
  if (orderBy) {
    uri += `&order_by=${orderBy}`;
  }
  if (printerFilter) {
    uri += `&filter=printer_host:${printerFilter}`;
  }
  return fetch(uri)
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Cannot get list of printjobs: ${response.status}`);
        return {
          "items": []
        };
      }
      return response.json();
    }).catch((e) => {
      console.error(`Cannot get list of printjobs: ${e}`);
      return {
        "items": []
      };
    });
}

export const enqueueTask = (task) => {
  return fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      task: task,
    }),
  })
    .then((response) => {
      if (response.status !== 202) {
        console.error(`Cannot enqueue a task: ${response.status}`);
      }
      return response.status;
    }).catch((e) => {
      console.error(`Cannot enqueue a task: ${e}`);
      return 500;
    }); 
}

export const heartbeat = () => {
  return fetch(`${BASE_URL}/`)
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Heartbeat fail: ${response.status}`);
        return false;
      }
      return true;
    }).catch((e) => {
      console.error(`Heartbeat fail: ${e}`);
      return false;
    })
}

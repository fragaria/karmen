const BASE_URL = window.env.BACKEND_BASE;

export const changeSettings = (settings) => {
  return fetch(`${BASE_URL}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  })
    .then((response) => {
      if (response.status !== 201) {
        console.error(`Cannot change a setting: ${response.status}`);
      }
      return response.status;
    }).catch((e) => {
      console.error(`Cannot change a setting: ${e}`);
      return 500;
    })
}

export const getSettings = (settings) => {
  return fetch(`${BASE_URL}/settings`)
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Cannot get settings: ${response.status}`);
        return [];
      }
      return response.json();
    }).catch((e) => {
      console.error(`Cannot get settings: ${e}`);
      return [];
    })
}
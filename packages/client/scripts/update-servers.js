const request = require("request-promise-native");
const fs = require("fs");
const path = require("path");

const init = async () => {
  try {
    const data = await request.get({
      json: true,
      uri: "https://myip.ht/servers-geo.json",
      timeout: 3000
    });

    if (data && data.length > 0) {
      fs.writeFileSync(
        path.join(__dirname, "..", "servers.json"),
        JSON.stringify(
          data
            .map(server => {
              return { ...server, distance: null };
            })
            .sort((a, b) => {
              if (a.host < b.host) {
                return -1;
              }
              if (a.host > b.host) {
                return 1;
              }
              return 0;
            })
        ),
        {
          mode: 0o600
        }
      );
    }
  } catch (error) {
    console.log(error);
  }
};

init();

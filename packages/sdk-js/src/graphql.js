import request from "request-promise-native";

export default async ({ query, variables, authToken }) => {
  try {
    let headers = { "Content-Type": "application/json" };

    if (authToken) {
      headers = { ...headers, Authorization: `Bearer ${authToken}` };
    }

    const body = JSON.stringify({
      query,
      variables
    });

    const result = await request.post({
      url: "https://my.vpn.ht/graphql",
      headers,
      body
    });

    const resultJson = JSON.parse(result);

    if (resultJson && resultJson.errors) {
      // use first error as graphql return array of errors
      return { result: false, error: resultJson.errors[0] };
    }

    return { result: resultJson.data, error: false };
  } catch (error) {
    return { result: false, error };
  }
};

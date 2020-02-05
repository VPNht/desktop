import callService from "./service";

export default async () => {
  try {
    const { error, result } = await callService({
      method: "GET",
      path: "/status"
    });
    if (error) {
      return false;
    }
    const serviceStatus = JSON.parse(result);
    return serviceStatus.status;
  } catch (error) {
    console.log(error);
    return false;
  }
};

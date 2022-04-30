import SitumPlugin from "react-native-situm-plugin";
import { SITUM_EMAIL, SITUM_API_KEY } from "./config";

export function initSitumSdk() {
  SitumPlugin.initSitumSDK();
  SitumPlugin.setApiKey(SITUM_EMAIL, SITUM_API_KEY, (response) => {
    console.log(JSON.stringify(response));
    console.log("Authenticated Succesfully: " + response.success);
  });
  SitumPlugin.setCacheMaxAge(1, (response) => {
    console.log("Cache Age: " + response.success);
  });
  SitumPlugin.sdkVersions((response) => {
    console.log("VERSIONS: " + JSON.stringify(response));
  });
}

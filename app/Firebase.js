import RNFirebase from 'react-native-firebase'

const firebase = __DEV__ ? null : RNFirebase.initializeApp({
    errorOnMissingPlayServices: false,
    promptOnMissingPlayServices: false,
});
if (firebase) {
    firebase.perf().setPerformanceCollectionEnabled(true);
}

function analyticsLogEvent(string, params) {
    if (!firebase || !firebase.analytics())
        return;
    firebase.analytics().logEvent(string, params);
}

let currentScreen = null
function analyticsSetCurrentScreen(screenName, screenClass) {
    if (!firebase || !firebase.analytics())
        return;
    firebase.analytics().setCurrentScreen(screenName, screenClass);
    if (currentScreen !== screenName) {
        currentScreen = screenName;
        firebase.analytics().logEvent("screen_view_" + screenName);
    }
}

export { analyticsLogEvent, analyticsSetCurrentScreen }
export default firebase
